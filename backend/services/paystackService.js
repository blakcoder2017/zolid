// const axios = require('axios'); 
// const { v4: uuidv4 } = require('uuid');
// require('dotenv').config();

// class PaystackService {
//     static BASE_URL = "https://api.paystack.co";

//     static getHeaders() {
//         const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
//         if (!SECRET_KEY) {
//             throw new Error("Paystack Secret Key is missing.");
//         }
//         return {
//             'Authorization': `Bearer ${SECRET_KEY}`,
//             'Content-Type': 'application/json',
//         };
//     }
    
//     /**
//      * Executes the asynchronous HTTP request to the Paystack API using Axios.
//      */
//     static async request(method, endpoint, data = null) {
//         const url = `${PaystackService.BASE_URL}${endpoint}`;
//         const headers = PaystackService.getHeaders();
        
//         try {
//             const options = {
//                 method: method,
//                 url: url,
//                 headers: headers,
//                 data: data,
//             };

//             const response = await axios(options);
//             const responseJson = response.data;

//             if (responseJson.status === false) {
//                  const paystackError = responseJson.message || "Paystack request failed with status=false.";
//                  throw new Error(paystackError); 
//             }

//             return responseJson.data;

//         } catch (error) {
//             let errorMessage = error.message;

//             if (error.response) {
//                 const status = error.response.status;
//                 const responseData = error.response.data;
//                 errorMessage = responseData.message || `Paystack HTTP Error ${status}`;
//             }

//             throw new Error(`Paystack API Error (${method} ${endpoint}): ${errorMessage}`);
//         }
//     }

//     static verifyGhanaCard(ghCardNumber, phoneNumber) {
//         // Placeholder for future live identity verification implementation (NIA API).
//         if (!ghCardNumber || !phoneNumber) return false;
        
//         // MOCK LOGIC for successful check:
//         return ghCardNumber.startsWith("GHA") && phoneNumber.length > 10;
//     }
    
//     /**
//      * NEW: Creates a Transfer Recipient in Paystack for instant disbursements (F.S.2).
//      * @param {string} name - The resolved name of the artisan.
//      * @param {string} accountNumber - The MoMo number.
//      * @param {string} bankCode - The MoMo network bank code (e.g., '001').
//      * @returns {object} Contains the recipient code and Paystack ID.
//      * @param {string} reference - The transaction reference from the URL
//      */
//     static async createTransferRecipient(name, accountNumber, bankCode) {
//         const endpoint = "/transferrecipient";
        
//         const payload = {
//             type: "mobile_money", 
//             name: name,
//             account_number: accountNumber,
//             bank_code: bankCode,
//             currency: "GHS"
//         };

//         const data = await PaystackService.request('POST', endpoint, payload);
        
//         // Data contains { recipient_code, type, name, details, id }
//         return {
//             recipient_code: data.recipient_code,
//             paystack_recipient_id: data.id,
//         };
//     }


//     /**
//      * Fetches and filters the list of Ghana MoMo bank codes from Paystack.
//      */
//     static async fetchGhanaMomoBankCodes() {
//         const endpoint = "/bank?country=ghana&type=mobile_money"; 
        
//         try {
//             const banks = await PaystackService.request('GET', endpoint);
            
//             const momoCodes = {};
            
//             banks.forEach(bank => {
//                 const nameUpper = bank.name.toUpperCase();
                
//                 let networkKey = null;
//                 if (nameUpper.includes('MTN')) networkKey = 'MTN';
//                 else if (nameUpper.includes('VODAFONE')) networkKey = 'VODAFONE';
//                 else if (nameUpper.includes('TELECEL') || nameUpper.includes('AIRTEL') || nameUpper.includes('TIGO')) networkKey = 'TELECEL';

//                 if (networkKey && bank.code) {
//                     momoCodes[networkKey] = bank.code;
//                 }
//             });
            
//             if (Object.keys(momoCodes).length < 3) {
//                 throw new Error("Incomplete results resolved from Paystack.");
//             }
            
//             return momoCodes;
//         } catch (e) {
//             // FALLBACK FIX: Use the Paystack test bank code '001' to bypass limits/resolution errors
//             console.warn(`WARNING: Failed to fetch live MoMo codes (${e.message}). Using Paystack test code '001' for all networks.`);
//             return {
//                 'MTN': '001', 
//                 'VODAFONE': '001', 
//                 'TELECEL': '001' 
//             };
//         }
//     }


//     exports.verifyTransaction = async (reference) => {
//         try {
//           // 1. Call Paystack API to verify status
//           const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
//             headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
//           });
      
//           const { status, metadata, amount } = response.data.data;
      
//           if (status !== 'success') {
//             return { success: false, message: 'Transaction was not successful' };
//           }
      
//           const { job_id, quote_id } = metadata;
      
//           if (!job_id) {
//              throw new BadRequestError('Transaction metadata missing job_id');
//           }
      
//           // 2. Update Database (Transaction Safe)
//           await db.query('BEGIN');
      
//           // Update Job Status to ESCROW_HELD
//           const updateJob = await db.query(
//             `UPDATE jobs 
//              SET current_state = 'ESCROW_HELD', 
//                  payment_reference = $1,
//                  amount_paid_pesewas = $2,
//                  updated_at = NOW()
//              WHERE id = $3
//              RETURNING id`,
//             [reference, amount, job_id]
//           );
      
//           if (updateJob.rows.length === 0) {
//             await db.query('ROLLBACK');
//             throw new NotFoundError(`Job with ID ${job_id} not found`);
//           }
      
//           // Update Quote Status (if this payment was for a specific quote)
//           if (quote_id) {
//             await db.query(
//               `UPDATE quotes SET status = 'ACCEPTED' WHERE id = $1`, 
//               [quote_id]
//             );
            
//             // Optionally: Reject other pending quotes for this job
//             await db.query(
//               `UPDATE quotes SET status = 'REJECTED' WHERE job_id = $1 AND id != $2 AND status = 'PENDING'`,
//               [job_id, quote_id]
//             );
//           }
      
//           await db.query('COMMIT');
      
//           return { 
//             success: true, 
//             data: { job_id, quote_id, reference } 
//           };
      
//         } catch (error) {
//           await db.query('ROLLBACK');
//           console.error('Paystack Verification Service Error:', error.message);
//           // If axios error, extract message
//           const msg = error.response?.data?.message || error.message || 'Payment verification failed';
//           throw new Error(msg);
//         }
//       };

//     /**
//      * ARTISAN SIGNUP STEP 1: Resolves MoMo number and verifies the account name.
//      */
//     static async resolveMoMoNumber(accountNumber, bankCode) {
//         const endpoint = `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
        
//         const data = await PaystackService.request('GET', endpoint);
        
//         return {
//             resolved_account_name: data.account_name,
//             resolved_account_number: data.account_number,
//         };
//     }

//     static async initiateCollection(options) {
//         // Support both old positional params and new object params
//         let referenceId, amountPesewas, clientEmail, clientPhone, metadata;
        
//         if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
//             // New object-based API
//             referenceId = options.reference;
//             amountPesewas = options.amount;
//             clientEmail = options.email;
//             clientPhone = options.phone;
//             metadata = options.metadata;
//         } else {
//             // Old positional params (backwards compatibility)
//             referenceId = arguments[0];
//             amountPesewas = arguments[1];
//             clientEmail = arguments[2];
//             clientPhone = arguments[3];
//         }
        
//         const endpoint = "/transaction/initialize";

//         if (amountPesewas < 100) {
//             throw new Error("Minimum payment is GHS 1.00 (100 pesewas).");
//         }

//         // Extract job_id from reference if it's in format "jobId-uuid", otherwise use reference as job_id
//         const jobIdFromReference = referenceId.includes('-') ? referenceId.split('-')[0] : referenceId;
        
//         const payload = {
//             reference: referenceId,
//             amount: amountPesewas, 
//             email: clientEmail, 
//             currency: "GHS",
//             metadata: metadata || {
//                 job_id: jobIdFromReference, // Store the actual job ID in metadata
//                 client_phone: clientPhone
//             },
//             callback_url: "https://zolid.online/paystack/verify-transaction", 
//         };

//         const data = await PaystackService.request('POST', endpoint, payload);
        
//         return {
//             paystack_ref: data.reference, 
//             authorization_url: data.authorization_url,
//             amount_pesewas: amountPesewas,
//             status: true
//         };
//     }

//     static async initializeTransfer(referenceId, recipientCode, amountPesewas, reason, batchId = null) {
//         const endpoint = "/transfer";
        
//         if (!referenceId) throw new Error("Reference ID (Job ID) is required for transfer.");
        
//         const payload = {
//             source: "balance", 
//             amount: amountPesewas, 
//             recipient: recipientCode,
//             reference: referenceId, 
//             reason: reason,
//             currency: "GHS",
//         };

//         // Add batch code if provided (for batch remittances)
//         if (batchId) {
//             payload.batch_code = batchId;
//         }

//         const data = await PaystackService.request('POST', endpoint, payload);
        
//         return {
//             reference: data.reference,
//             paystack_transfer_id: data.id, 
//             transfer_code: data.transfer_code,
//             batch_code: data.batch_code || null,
//             status: data.status, 
//             message: data.message
//         };
//     }
// }

// module.exports = PaystackService;

const axios = require('axios'); 
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db'); // Required for database updates in verifyTransaction
require('dotenv').config();

class PaystackService {
    static BASE_URL = "https://api.paystack.co";

    static getHeaders() {
        const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
        if (!SECRET_KEY) {
            throw new Error("Paystack Secret Key is missing.");
        }
        return {
            'Authorization': `Bearer ${SECRET_KEY}`,
            'Content-Type': 'application/json',
        };
    }
    
    /**
     * Executes the asynchronous HTTP request to the Paystack API using Axios.
     */
    static async request(method, endpoint, data = null) {
        const url = `${PaystackService.BASE_URL}${endpoint}`;
        const headers = PaystackService.getHeaders();
        
        try {
            const options = {
                method: method,
                url: url,
                headers: headers,
                data: data,
            };

            const response = await axios(options);
            const responseJson = response.data;

            if (responseJson.status === false) {
                 const paystackError = responseJson.message || "Paystack request failed with status=false.";
                 throw new Error(paystackError); 
            }

            return responseJson.data;

        } catch (error) {
            let errorMessage = error.message;

            if (error.response) {
                const status = error.response.status;
                const responseData = error.response.data;
                errorMessage = responseData.message || `Paystack HTTP Error ${status}`;
            }

            throw new Error(`Paystack API Error (${method} ${endpoint}): ${errorMessage}`);
        }
    }

    static verifyGhanaCard(ghCardNumber, phoneNumber) {
        // Placeholder for future live identity verification implementation (NIA API).
        if (!ghCardNumber || !phoneNumber) return false;
        
        // MOCK LOGIC for successful check:
        return ghCardNumber.startsWith("GHA") && phoneNumber.length > 10;
    }
    
    /**
     * Creates a Transfer Recipient in Paystack for instant disbursements (F.S.2).
     */
    static async createTransferRecipient(name, accountNumber, bankCode) {
        const endpoint = "/transferrecipient";
        
        const payload = {
            type: "mobile_money", 
            name: name,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: "GHS"
        };

        const data = await PaystackService.request('POST', endpoint, payload);
        
        // Data contains { recipient_code, type, name, details, id }
        return {
            recipient_code: data.recipient_code,
            paystack_recipient_id: data.id,
        };
    }


    /**
     * Fetches and filters the list of Ghana MoMo bank codes from Paystack.
     */
    static async fetchGhanaMomoBankCodes() {
        const endpoint = "/bank?country=ghana&type=mobile_money"; 
        
        try {
            const banks = await PaystackService.request('GET', endpoint);
            const momoCodes = {};
            
            banks.forEach(bank => {
                const nameUpper = bank.name.toUpperCase();
                
                // 1. MTN
                if (nameUpper.includes('MTN')) {
                    momoCodes['MTN'] = bank.code;
                } 
                // 2. Telecel (Merge Vodafone & Telecel into ONE key)
                else if (nameUpper.includes('VODAFONE') || nameUpper.includes('TELECEL')) {
                    momoCodes['Telecel'] = bank.code; 
                } 
                // 3. AT (Merge Airtel, Tigo, AT into ONE key)
                else if (nameUpper.includes('AIRTEL') || nameUpper.includes('TIGO') || nameUpper.includes('AT')) {
                    momoCodes['AT'] = bank.code; 
                }
            });
            
            return momoCodes;
    
        } catch (e) {
            console.warn(`Using Fallback: ${e.message}`);
            // Return Clean Fallback
            return {
                'MTN': 'MTN',
                'Telecel': 'VOD',
                'AT': 'ATL'
            };
        }
    }

    /**
     * Verifies a transaction via Paystack API and updates the job status
     */
    static async verifyTransaction(reference) {
        try {
            // 1. Call Paystack API via internal request method
            const endpoint = `/transaction/verify/${reference}`;
            const data = await PaystackService.request('GET', endpoint);

            // Paystack returns data object with status, metadata, etc.
            const { status, metadata, amount } = data;

            if (status !== 'success') {
                return { success: false, message: 'Transaction was not successful' };
            }

            const { job_id, quote_id } = metadata || {};

            if (!job_id) {
                throw new Error('Transaction metadata missing job_id');
            }

            // 2. Update Database (Transaction Safe)
            await db.query('BEGIN');

            // Update Job Status to ESCROW_HELD
            const updateJob = await db.query(
                `UPDATE jobs 
                 SET current_state = 'ESCROW_HELD', 
                     payment_reference = $1,
                     amount_paid_pesewas = $2,
                     updated_at = NOW()
                 WHERE id = $3
                 RETURNING id`,
                [reference, amount, job_id]
            );

            if (updateJob.rows.length === 0) {
                await db.query('ROLLBACK');
                throw new Error(`Job with ID ${job_id} not found`);
            }

            // Update Quote Status (if this payment was for a specific quote)
            if (quote_id) {
                await db.query(
                    `UPDATE quotes SET status = 'ACCEPTED' WHERE id = $1`, 
                    [quote_id]
                );
                
                // Optionally: Reject other pending quotes for this job
                await db.query(
                    `UPDATE quotes SET status = 'REJECTED' WHERE job_id = $1 AND id != $2 AND status = 'PENDING'`,
                    [job_id, quote_id]
                );
            }

            await db.query('COMMIT');

            return { 
                success: true, 
                data: { job_id, quote_id, reference } 
            };

        } catch (error) {
            await db.query('ROLLBACK');
            console.error('Paystack Verification Service Error:', error.message);
            throw new Error(error.message || 'Payment verification failed');
        }
    }

    /**
     * ARTISAN SIGNUP STEP 1: Resolves MoMo number and verifies the account name.
     */
    static async resolveMoMoNumber(accountNumber, bankCode) {
        const endpoint = `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
        
        const data = await PaystackService.request('GET', endpoint);
        
        return {
            resolved_account_name: data.account_name,
            resolved_account_number: data.account_number,
        };
    }

    static async initiateCollection(options) {
        // Support both old positional params and new object params
        let referenceId, amountPesewas, clientEmail, clientPhone, metadata;
        
        if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
            // New object-based API
            referenceId = options.reference;
            amountPesewas = options.amount;
            clientEmail = options.email;
            clientPhone = options.phone;
            metadata = options.metadata;
        } else {
            // Old positional params (backwards compatibility)
            referenceId = arguments[0];
            amountPesewas = arguments[1];
            clientEmail = arguments[2];
            clientPhone = arguments[3];
        }
        
        const endpoint = "/transaction/initialize";

        if (amountPesewas < 100) {
            throw new Error("Minimum payment is GHS 1.00 (100 pesewas).");
        }

        // Extract job_id from reference if it's in format "jobId-uuid", otherwise use reference as job_id
        const jobIdFromReference = referenceId.includes('-') ? referenceId.split('-')[0] : referenceId;
        
        const payload = {
            reference: referenceId,
            amount: amountPesewas, 
            email: clientEmail, 
            currency: "GHS",
            metadata: metadata || {
                job_id: jobIdFromReference, 
                client_phone: clientPhone
            },
            // callback_url: "https://zolid.online/paystack/verify-transaction",
            // callback_url: "https://00ff63a25174.ngrok-free.app/paystack/verify-transaction" 
            callback_url: process.env.PAYSTACK_CALLBACK_URL
        };

        // --- ADD THIS LOG TO DEBUG ---
    console.log("🚀 DEBUG: Sending Callback URL to Paystack:", payload.callback_url); 
    // --

        const data = await PaystackService.request('POST', endpoint, payload);
        
        return {
            paystack_ref: data.reference, 
            authorization_url: data.authorization_url,
            amount_pesewas: amountPesewas,
            status: true
        };
    }

    static async initializeTransfer(referenceId, recipientCode, amountPesewas, reason, batchId = null) {
        const endpoint = "/transfer";
        
        if (!referenceId) throw new Error("Reference ID (Job ID) is required for transfer.");
        
        const payload = {
            source: "balance", 
            amount: amountPesewas, 
            recipient: recipientCode,
            reference: referenceId, 
            reason: reason,
            currency: "GHS",
        };

        // Add batch code if provided (for batch remittances)
        if (batchId) {
            payload.batch_code = batchId;
        }

        const data = await PaystackService.request('POST', endpoint, payload);
        
        return {
            reference: data.reference,
            paystack_transfer_id: data.id, 
            transfer_code: data.transfer_code,
            batch_code: data.batch_code || null,
            status: data.status, 
            message: data.message
        };
    }
}

module.exports = PaystackService;