const axios = require('axios');
const AppError = require('../utils/appError');
const RiviaCardService = require('./riviaCardService');
const db = require('../db/db');

class RiviaService {
    constructor() {
        this.baseUrl = process.env.RIVIA_API_URL ;
        this.apiKey = process.env.RIVIA_API_KEY;
    }

    async request(method, endpoint, data = null) {
        if (!this.apiKey) throw new AppError('Rivia API Token not configured', 500);
        try {
            const config = {
                method,
                url: `${this.baseUrl}${endpoint}`,
                headers: { 
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                data
            };
            const response = await axios(config);
            
            // Handle cases where response might not be valid JSON
            if (!response.data) {
                console.warn(`Warning: Empty response from Rivia API [${endpoint}]`);
                return { message: "Empty response from Rivia API", data: null };
            }
            
            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            const status = error.response?.status || 'unknown';
            const fullError = error.response?.data || error;
            console.error(`Rivia API Error [${endpoint}]`, {
                status: status,
                message: msg,
                fullResponse: fullError
            });
            throw new AppError(`Rivia Provider Error: ${msg}`, 502);
        }
    }

    // --- ACCOUNTS ---

    /**
     * Get User Profile
     */
    async getUserProfile() {
        return this.request('GET', '/accounts/me');
    }

    /**
     * Get All Company Accounts
     */
    async getAllCompanyAccounts() {
        return this.request('GET', '/accounts');
    }

    /**
     * Create a New Account (Invite User)
     */
    async createAccount(email, role) {
        return this.request('POST', '/accounts', { email, role });
    }

    /**
     * Verify and Activate User Account
     */
    async verifyAccount(key, name, contact) {
        return this.request('PATCH', '/accounts/verify', { key, name, contact });
    }

    /**
     * Update an Existing Account
     */
    async updateAccount(accountId, updates) {
        return this.request('PATCH', `/accounts/${accountId}`, updates);
    }

    /**
     * Delete an Account
     */
    async deleteAccount(accountId) {
        return this.request('DELETE', `/accounts/${accountId}`);
    }

    // --- APPOINTMENTS ---

    /**
     * Book an Appointment for Member
     */
    async bookAppointment(appointmentData) {
        return this.request('POST', '/appointments', appointmentData);
    }

    /**
     * Retrieve a Member Appointment by ID
     */
    async getAppointment(appointmentId) {
        return this.request('GET', `/appointments/${appointmentId}`);
    }

    /**
     * Update an Existing Appointment
     */
    async updateAppointment(appointmentId, updates) {
        return this.request('PATCH', `/appointments/${appointmentId}`, updates);
    }

    // --- AUTHENTICATION ---

    /**
     * Request OTP for Authentication
     */
    async requestOTP(key) {
        return this.request('POST', '/auth/otp/request', { key });
    }

    /**
     * Verify OTP and Obtain JWT Token
     */
    async verifyOTP(key, otp) {
        return this.request('POST', '/auth/otp/verify', { key, otp });
    }

    // --- CARDS ---

    /**
     * Verify/Retrieve Access Card by Code
     */
    async verifyCard(cardCode) {
        return this.request('GET', `/cards/${cardCode}`);
    }

    /**
     * Activate an Access Card
     */
    async activateCard(cardCode, contact, firstName, lastName, email = null) {
        const payload = { code: cardCode, contact, firstName, lastName };
        if (email) payload.email = email;
        return this.request('POST', '/cards/activations', payload);
    }

    // --- CHANNELS ---

    /**
     * Create a New Access Card Channel (Sponsor)
     */
    async createChannel(sponsorData) {
        return this.request('POST', '/channels', sponsorData);
    }

    /**
     * Register ZOLID as a Channel (Run once)
     */
    async registerZolidChannel() {
        return this.createChannel({
            sponsorName: "ZOLID Systems",
            contact: "0594836357", // ZOLID Official Contact
            email: "info@zolid.online",
            location: "Tamale, Ghana",
            sponsorType: "business"
        });
    }

    /**
     * Retrieve All Cards for a Specific Channel
     */
    async getChannelCards(channelId) {
        if (!channelId) throw new AppError("Channel ID required to fetch cards", 500);
        return this.request('GET', `/channels/${channelId}/cards`);
    }

    /**
     * Get Channel ID by Sponsor Name
     */
    async getChannelIdBySponsorName(sponsorName) {
        if (!sponsorName) throw new AppError("Sponsor name is required", 400);
        // This is a placeholder. In a real implementation, you would query the Rivia API
        // or your database to fetch the channel ID based on the sponsor name.
        // For now, we'll return a mock response.
        return {
            message: "Channel ID retrieved successfully",
            data: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                sponsorName: sponsorName,
                contact: "501234567"
            }
        };
    }

    /**
     * Get all artisans insured under ZOLID
     * This is the "Truth Source" for your monthly bill.
     */
    async getZolidCards(channelId) {
        return this.getChannelCards(channelId);
    }

    // --- FACILITIES ---

    /**
     * Register a Facility Interest to Join the Network
     */
    async registerFacility(facilityData) {
        return this.request('POST', '/facilities', facilityData);
    }

    /**
     * Retrieve All Active Rivia Partner Facilities
     */
    async getAllFacilities(sort = null, filter = null) {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (filter) params.append('filter', filter);
        const endpoint = `/facilities${params.toString() ? '?' + params.toString() : ''}`;
        return this.request('GET', endpoint);
    }

    /**
     * Retrieve All Active Rivia Facility Locations
     */
    async getAllFacilityLocations(sort = null, filter = null) {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (filter) params.append('filter', filter);
        const endpoint = `/facilities/branches${params.toString() ? '?' + params.toString() : ''}`;
        return this.request('GET', endpoint);
    }

    /**
     * Retrieve Facility Details by ID
     */
    async getFacilityDetails(facilityId) {
        return this.request('GET', `/facilities/${facilityId}`);
    }

    /**
     * Retrieve Branch Locations for a Specific Facility
     */
    async getFacilityBranches(facilityId) {
        return this.request('GET', `/facilities/${facilityId}/branches`);
    }

    /**
     * Retrieve Services Provided by a Specific Facility
     */
    async getFacilityServices(facilityId) {
        return this.request('GET', `/facilities/${facilityId}/services`);
    }

    // --- FEEDBACK ---

    /**
     * Retrieve Public Feedback Form
     */
    async getFeedbackForm(hashCode) {
        return this.request('GET', `/feedback/${hashCode}`);
    }

    /**
     * Submit Visit Feedback
     */
    async submitFeedback(hashCode, feedbackData) {
        return this.request('POST', `/feedback/${hashCode}`, feedbackData);
    }

    // --- MEMBERS ---

    /**
     * Register a New Member
     */
    async registerMember(memberData) {
        console.log('URL', this.baseUrl + '/members');
        console.log('token', this.apiKey);
        return this.request('POST', '/members', memberData);
    }

    /**
     * Register Artisan as Member and Activate Free Access Card
     * This method handles the complete workflow for artisan registration on Rivia
     */
    async registerArtisanAndActivateFreeCard(fullName, phone, email = null) {
        // Split full name into first and last names
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // Register member first
        const memberData = {
            firstName,
            lastName,
            contact: phone,
            dob: null, // Not required for Free plan
            email: email || null,
            gender: null, // Not required for Free plan
            secondaryContact: null, // Not required for Free plan
            location: null // Not required for Free plan
        };

        const memberResult = await this.registerMember(memberData);
        const memberId = memberResult.data.id;

        // Get database client for card operations
        const client = await db.getClient();

        try {
            // Get an unassigned free card from the database
            const unassignedCard = await RiviaCardService.getUnassignedFreeCard(client);

            if (!unassignedCard) {
                throw new AppError('No unassigned free cards available', 404);
            }

            const cardCode = unassignedCard.card_code;

            // Assign the card to the member in the database
            const assignedCard = await RiviaCardService.assignCardToMember(client, unassignedCard.id, memberId);

            // Activate the access card on the Rivico API
            const activationResult = await this.activateCard(cardCode, phone, firstName, lastName, email);

            return {
                memberId,
                cardCode,
                activationResult,
                cardDetails: assignedCard
            };
        } finally {
            // Release the database client
            client.release();
        }
    }

    /**
     * Retrieve a Member by ID
     */
    async getMember(memberId) {
        return this.request('GET', `/members/${memberId}`);
    }

    /**
     * Retrieve All Visits for a Specific Member
     */
    async getMemberVisits(memberId) {
        return this.request('GET', `/members/${memberId}/visits`);
    }

    /**
     * Retrieve a Specific Visit Consultation for a Member
     */
    async getMemberVisitDetails(memberId, visitId) {
        return this.request('GET', `/members/${memberId}/visits/${visitId}`);
    }

    /**
     * Retrieve the Bill for a Specific Member Visit
     */
    async getMemberVisitBill(memberId, visitId) {
        return this.request('GET', `/members/${memberId}/visits/${visitId}/bill`);
    }

    /**
     * Retrieve All Appointments for a Specific Member
     */
    async getMemberAppointments(memberId, options = {}) {
        const params = new URLSearchParams();
        if (options.sort) params.append('sort', options.sort);
        if (options.filter) params.append('filter', options.filter);
        if (options.offset) params.append('offset', options.offset);
        if (options.limit) params.append('limit', options.limit);
        if (options.upcoming) params.append('upcoming', options.upcoming);
        const endpoint = `/members/${memberId}/appointments${params.toString() ? '?' + params.toString() : ''}`;
        return this.request('GET', endpoint);
    }

    // --- MEMBERSHIPS ---

    /**
     * Retrieve Membership Subscription Details by ID
     */
    async getMembership(membershipId) {
        return this.request('GET', `/memberships/${membershipId}`);
    }

    /**
     * Retrieve All Membership Dependents for a Member
     */
    async getMembershipDependents(membershipId) {
        return this.request('GET', `/memberships/${membershipId}/dependents`);
    }
}

module.exports = new RiviaService();