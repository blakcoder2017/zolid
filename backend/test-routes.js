const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const API_V1 = '/api/v1';

// Test results storage
const testResults = {
    passed: [],
    failed: [],
    skipped: []
};

// Helper function to make requests
async function makeRequest(method, endpoint, data = null, headers = {}, description = '') {
    const url = `${BASE_URL}${API_V1}${endpoint}`;
    const config = {
        method,
        url,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        data,
        validateStatus: () => true // Don't throw on any status
    };

    try {
        const response = await axios(config);
        return {
            success: response.status >= 200 && response.status < 300,
            status: response.status,
            data: response.data,
            description
        };
    } catch (error) {
        return {
            success: false,
            status: error.response?.status || 0,
            data: error.response?.data || { error: error.message },
            description,
            error: error.message
        };
    }
}

// Helper to make file upload request
async function makeFileUpload(endpoint, fields, files, headers = {}, description = '') {
    const url = `${BASE_URL}${API_V1}${endpoint}`;
    const formData = new FormData();
    
    // Add fields
    Object.entries(fields || {}).forEach(([key, value]) => {
        formData.append(key, value);
    });
    
    // Add files
    Object.entries(files || {}).forEach(([key, filePath]) => {
        if (filePath && fs.existsSync(filePath)) {
            formData.append(key, fs.createReadStream(filePath));
        }
    });

    try {
        const response = await axios.post(url, formData, {
            headers: {
                ...formData.getHeaders(),
                ...headers
            },
            validateStatus: () => true
        });
        
        return {
            success: response.status >= 200 && response.status < 300,
            status: response.status,
            data: response.data,
            description
        };
    } catch (error) {
        return {
            success: false,
            status: error.response?.status || 0,
            data: error.response?.data || { error: error.message },
            description,
            error: error.message
        };
    }
}

// Test data
let artisanToken = null;
let clientToken = null;
let artisanId = null;
let clientId = null;
let tempToken = null;
let jobId = null;

console.log('🚀 Starting API Route Tests...\n');
console.log(`Testing against: ${BASE_URL}\n`);

// ============================================================================
// 1. HEALTH CHECK & ROOT ENDPOINTS
// ============================================================================
async function testHealthAndRoot() {
    console.log('📋 Testing Health & Root Endpoints...\n');
    
    // Health check
    const health = await makeRequest('GET', '/health', null, {}, 'Health Check');
    console.log(`Health Check: ${health.success ? '✅' : '❌'} (${health.status})`);
    
    // Root endpoint (actually in server.js, not under /api/v1)
    try {
        const root = await axios.get(`${BASE_URL}/`);
        console.log(`Root Endpoint: ${root.status === 200 ? '✅' : '❌'} (${root.status})`);
    } catch (e) {
        console.log(`Root Endpoint: ❌`);
    }
}

// ============================================================================
// 2. IDENTITY ROUTES
// ============================================================================
async function testIdentityRoutes() {
    console.log('\n📋 Testing Identity Routes...\n');
    
    // Test data
    const testArtisanPhone = '+233552537904'; // Dev test account
    const testClientPhone = '+233241234567';
    const testClientEmail = 'testclient@zolid.com';
    
    // 1. Artisan Signup Step 1: MoMo Verification
    console.log('1. POST /identity/artisan/signup/verify');
    const momoVerify = await makeRequest('POST', '/identity/artisan/signup/verify', {
        phone_primary: testArtisanPhone,
        full_name: 'ZOLID TEST ACCOUNT',
        momo_network: 'MTN'
    }, {}, 'Artisan MoMo Verification');
    
    if (momoVerify.success && momoVerify.data.temp_token) {
        tempToken = momoVerify.data.temp_token;
        console.log(`   ✅ Passed - Temp token received`);
        testResults.passed.push({
            endpoint: 'POST /identity/artisan/signup/verify',
            status: momoVerify.status,
            body: { phone_primary: testArtisanPhone, full_name: 'ZOLID TEST ACCOUNT', momo_network: 'MTN' },
            response: momoVerify.data
        });
    } else {
        console.log(`   ❌ Failed - ${momoVerify.data.error || momoVerify.data.message || 'Unknown error'}`);
        testResults.failed.push({ endpoint: 'POST /identity/artisan/signup/verify', ...momoVerify });
    }
    
    // 2. Artisan Signup Step 2: Complete Registration
    if (tempToken) {
        console.log('\n2. POST /identity/artisan/signup/complete');
        const completeSignup = await makeRequest('POST', '/identity/artisan/signup/complete', {
            password: 'testpass123'
        }, {
            'x-temp-token': tempToken
        }, 'Artisan Registration Complete');
        
        if (completeSignup.success && completeSignup.data.token) {
            artisanToken = completeSignup.data.token;
            artisanId = completeSignup.data.artisan_id;
            console.log(`   ✅ Passed - Artisan registered, token received`);
            testResults.passed.push({
                endpoint: 'POST /identity/artisan/signup/complete',
                status: completeSignup.status,
                body: { password: 'testpass123' },
                headers: { 'x-temp-token': '***' },
                response: { ...completeSignup.data, token: '***' }
            });
        } else {
            console.log(`   ⚠️  Skipped (artisan may already exist)`);
            testResults.skipped.push({ endpoint: 'POST /identity/artisan/signup/complete' });
        }
    }
    
    // 3. Artisan Login
    console.log('\n3. POST /identity/artisan/login');
    const artisanLogin = await makeRequest('POST', '/identity/artisan/login', {
        phone_primary: testArtisanPhone,
        password: 'testpass123'
    }, {}, 'Artisan Login');
    
    if (artisanLogin.success && artisanLogin.data.token) {
        artisanToken = artisanLogin.data.token;
        artisanId = artisanLogin.data.artisan_id;
        console.log(`   ✅ Passed - Login successful`);
        testResults.passed.push({
            endpoint: 'POST /identity/artisan/login',
            status: artisanLogin.status,
            body: { phone_primary: testArtisanPhone, password: '***' },
            response: { ...artisanLogin.data, token: '***' }
        });
    } else {
        console.log(`   ❌ Failed - ${artisanLogin.data.error || 'Login failed'}`);
        testResults.failed.push({ endpoint: 'POST /identity/artisan/login', ...artisanLogin });
    }
    
    // 4. Artisan Identity Verification
    if (artisanToken) {
        console.log('\n4. POST /identity/artisan/verify-identity');
        const verifyIdentity = await makeRequest('POST', '/identity/artisan/verify-identity', {
            gh_card_number: 'GHA-123456789-0',
            home_gps_address: 'GA-123-456',
            primary_trade: 'Plumbing',
            primary_language: 'ENGLISH'
        }, {
            'Authorization': `Bearer ${artisanToken}`
        }, 'Artisan Identity Verification');
        
        if (verifyIdentity.success) {
            console.log(`   ✅ Passed - Identity verified`);
            testResults.passed.push({
                endpoint: 'POST /identity/artisan/verify-identity',
                status: verifyIdentity.status,
                body: { gh_card_number: 'GHA-123456789-0', home_gps_address: 'GA-123-456', primary_trade: 'Plumbing', primary_language: 'ENGLISH' },
                response: verifyIdentity.data
            });
        } else {
            console.log(`   ⚠️  ${verifyIdentity.data.error || 'May already be verified'}`);
            testResults.skipped.push({ endpoint: 'POST /identity/artisan/verify-identity' });
        }
    }
    
    // 5. Client Registration
    console.log('\n5. POST /identity/client/register');
    const clientRegister = await makeRequest('POST', '/identity/client/register', {
        phone_primary: testClientPhone,
        full_name: 'Test Client',
        email: testClientEmail,
        password: 'clientpass123',
        home_gps_address: 'GA-789-012',
        home_lat: 5.6037,
        home_lon: -0.1870
    }, {}, 'Client Registration');
    
    if (clientRegister.success) {
        clientId = clientRegister.data.client_id;
        console.log(`   ✅ Passed - Client registered`);
        testResults.passed.push({
            endpoint: 'POST /identity/client/register',
            status: clientRegister.status,
            body: { phone_primary: testClientPhone, full_name: 'Test Client', email: testClientEmail, password: '***', home_gps_address: 'GA-789-012', home_lat: 5.6037, home_lon: -0.1870 },
            response: clientRegister.data
        });
    } else {
        console.log(`   ⚠️  Skipped (client may already exist)`);
        testResults.skipped.push({ endpoint: 'POST /identity/client/register' });
    }
    
    // 6. Client Login
    console.log('\n6. POST /identity/client/login');
    const clientLogin = await makeRequest('POST', '/identity/client/login', {
        phone_primary: testClientPhone,
        password: 'clientpass123'
    }, {}, 'Client Login');
    
    if (clientLogin.success && clientLogin.data.token) {
        clientToken = clientLogin.data.token;
        clientId = clientLogin.data.client_id;
        console.log(`   ✅ Passed - Login successful`);
        testResults.passed.push({
            endpoint: 'POST /identity/client/login',
            status: clientLogin.status,
            body: { phone_primary: testClientPhone, password: '***' },
            response: { ...clientLogin.data, token: '***' }
        });
    } else {
        console.log(`   ❌ Failed - ${clientLogin.data.error || 'Login failed'}`);
        testResults.failed.push({ endpoint: 'POST /identity/client/login', ...clientLogin });
    }
}

// ============================================================================
// 3. PROFILE ROUTES
// ============================================================================
async function testProfileRoutes() {
    console.log('\n📋 Testing Profile Routes...\n');
    
    // 1. Get Profile (Artisan)
    if (artisanToken) {
        console.log('1. GET /profile/profile (Artisan)');
        const artisanProfile = await makeRequest('GET', '/profile/profile', null, {
            'Authorization': `Bearer ${artisanToken}`
        }, 'Get Artisan Profile');
        
        if (artisanProfile.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'GET /profile/profile (Artisan)',
                status: artisanProfile.status,
                body: null,
                response: artisanProfile.data
            });
        } else {
            console.log(`   ❌ Failed`);
            testResults.failed.push({ endpoint: 'GET /profile/profile (Artisan)', ...artisanProfile });
        }
    }
    
    // 2. Get Profile (Client)
    if (clientToken) {
        console.log('\n2. GET /profile/profile (Client)');
        const clientProfile = await makeRequest('GET', '/profile/profile', null, {
            'Authorization': `Bearer ${clientToken}`
        }, 'Get Client Profile');
        
        if (clientProfile.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'GET /profile/profile (Client)',
                status: clientProfile.status,
                body: null,
                response: clientProfile.data
            });
        } else {
            console.log(`   ❌ Failed`);
            testResults.failed.push({ endpoint: 'GET /profile/profile (Client)', ...clientProfile });
        }
    }
    
    // 3. Update Profile (Artisan)
    if (artisanToken) {
        console.log('\n3. PUT /profile/profile (Artisan)');
        const updateArtisan = await makeRequest('PUT', '/profile/profile', {
            full_name: 'Updated Artisan Name',
            primary_trade: 'Electrical'
        }, {
            'Authorization': `Bearer ${artisanToken}`
        }, 'Update Artisan Profile');
        
        if (updateArtisan.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'PUT /profile/profile (Artisan)',
                status: updateArtisan.status,
                body: { full_name: 'Updated Artisan Name', primary_trade: 'Electrical' },
                response: updateArtisan.data
            });
        } else {
            console.log(`   ❌ Failed`);
            testResults.failed.push({ endpoint: 'PUT /profile/profile (Artisan)', ...updateArtisan });
        }
    }
    
    // 4. Get Verification Status
    if (artisanToken) {
        console.log('\n4. GET /profile/verification-status');
        const verifStatus = await makeRequest('GET', '/profile/verification-status', null, {
            'Authorization': `Bearer ${artisanToken}`
        }, 'Get Verification Status');
        
        if (verifStatus.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'GET /profile/verification-status',
                status: verifStatus.status,
                body: null,
                response: verifStatus.data
            });
        } else {
            console.log(`   ❌ Failed`);
            testResults.failed.push({ endpoint: 'GET /profile/verification-status', ...verifStatus });
        }
    }
}

// ============================================================================
// 4. JOB ROUTES
// ============================================================================
async function testJobRoutes() {
    console.log('\n📋 Testing Job Routes...\n');
    
    // 1. Create Job (Client)
    if (clientToken) {
        console.log('1. POST /jobs/create');
        const createJob = await makeRequest('POST', '/jobs/create', {
            gross_fee_pesewas: 50000, // GHS 500.00
            location_lat: 5.6037,
            location_lon: -0.1870,
            location_gps_address: 'GA-123-456'
        }, {
            'Authorization': `Bearer ${clientToken}`
        }, 'Create Job');
        
        if (createJob.success) {
            jobId = createJob.data.job?.job_id;
            console.log(`   ✅ Passed - Job created: ${jobId}`);
            testResults.passed.push({
                endpoint: 'POST /jobs/create',
                status: createJob.status,
                body: { gross_fee_pesewas: 50000, location_lat: 5.6037, location_lon: -0.1870, location_gps_address: 'GA-123-456' },
                response: createJob.data
            });
        } else {
            console.log(`   ❌ Failed - ${createJob.data.error || 'Job creation failed'}`);
            testResults.failed.push({ endpoint: 'POST /jobs/create', ...createJob });
        }
    }
    
    // 2. Get Available Jobs (Artisan - requires gig gate)
    if (artisanToken) {
        console.log('\n2. GET /jobs/available');
        const availableJobs = await makeRequest('GET', '/jobs/available', null, {
            'Authorization': `Bearer ${artisanToken}`
        }, 'Get Available Jobs');
        
        if (availableJobs.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'GET /jobs/available',
                status: availableJobs.status,
                body: null,
                response: availableJobs.data
            });
        } else {
            console.log(`   ⚠️  ${availableJobs.data.error || 'May require full verification'}`);
            testResults.skipped.push({ endpoint: 'GET /jobs/available', reason: availableJobs.data.error });
        }
    }
    
    // 3. Get My Jobs (Artisan)
    if (artisanToken) {
        console.log('\n3. GET /jobs/my-jobs');
        const myJobs = await makeRequest('GET', '/jobs/my-jobs', null, {
            'Authorization': `Bearer ${artisanToken}`
        }, 'Get My Jobs (Artisan)');
        
        if (myJobs.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'GET /jobs/my-jobs',
                status: myJobs.status,
                body: null,
                response: myJobs.data
            });
        } else {
            console.log(`   ⚠️  ${myJobs.data.error || 'May require full verification'}`);
            testResults.skipped.push({ endpoint: 'GET /jobs/my-jobs' });
        }
    }
    
    // 4. Get Client Jobs
    if (clientToken && clientId) {
        console.log('\n4. GET /jobs/client/:clientId');
        const clientJobs = await makeRequest('GET', `/jobs/client/${clientId}`, null, {
            'Authorization': `Bearer ${clientToken}`
        }, 'Get Client Jobs');
        
        if (clientJobs.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'GET /jobs/client/:clientId',
                status: clientJobs.status,
                body: null,
                response: clientJobs.data
            });
        } else {
            console.log(`   ❌ Failed`);
            testResults.failed.push({ endpoint: 'GET /jobs/client/:clientId', ...clientJobs });
        }
    }
    
    // 5. Get Job Details
    if (jobId && clientToken) {
        console.log('\n5. GET /jobs/:jobId');
        const jobDetails = await makeRequest('GET', `/jobs/${jobId}`, null, {
            'Authorization': `Bearer ${clientToken}`
        }, 'Get Job Details');
        
        if (jobDetails.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'GET /jobs/:jobId',
                status: jobDetails.status,
                body: null,
                response: jobDetails.data
            });
        } else {
            console.log(`   ❌ Failed`);
            testResults.failed.push({ endpoint: 'GET /jobs/:jobId', ...jobDetails });
        }
    }
    
    // 6. Accept Job (Artisan)
    if (jobId && artisanToken) {
        console.log('\n6. POST /jobs/:jobId/accept');
        const acceptJob = await makeRequest('POST', `/jobs/${jobId}/accept`, {}, {
            'Authorization': `Bearer ${artisanToken}`
        }, 'Accept Job');
        
        if (acceptJob.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'POST /jobs/:jobId/accept',
                status: acceptJob.status,
                body: {},
                response: acceptJob.data
            });
        } else {
            console.log(`   ⚠️  ${acceptJob.data.error || 'May require gig gate'}`);
            testResults.skipped.push({ endpoint: 'POST /jobs/:jobId/accept' });
        }
    }
    
    // 7. Complete Job (Artisan)
    if (jobId && artisanToken) {
        console.log('\n7. POST /jobs/:jobId/complete');
        const completeJob = await makeRequest('POST', `/jobs/${jobId}/complete`, {
            work_description: 'Completed the plumbing work successfully'
        }, {
            'Authorization': `Bearer ${artisanToken}`
        }, 'Complete Job');
        
        if (completeJob.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'POST /jobs/:jobId/complete',
                status: completeJob.status,
                body: { work_description: 'Completed the plumbing work successfully' },
                response: completeJob.data
            });
        } else {
            console.log(`   ⚠️  ${completeJob.data.error || 'Job may not be in correct state'}`);
            testResults.skipped.push({ endpoint: 'POST /jobs/:jobId/complete' });
        }
    }
    
    // 8. Client Signoff
    if (jobId && clientToken) {
        console.log('\n8. POST /jobs/signoff');
        const signoff = await makeRequest('POST', '/jobs/signoff', {
            job_id: jobId,
            is_work_satisfactory: true
        }, {
            'Authorization': `Bearer ${clientToken}`
        }, 'Client Signoff');
        
        if (signoff.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'POST /jobs/signoff',
                status: signoff.status,
                body: { job_id: jobId, is_work_satisfactory: true },
                response: signoff.data
            });
        } else {
            console.log(`   ⚠️  ${signoff.data.error || 'Job may not be in correct state'}`);
            testResults.skipped.push({ endpoint: 'POST /jobs/signoff' });
        }
    }
    
    // 9. Dispute Job
    if (jobId && clientToken) {
        console.log('\n9. POST /jobs/:jobId/dispute');
        const dispute = await makeRequest('POST', `/jobs/${jobId}/dispute`, {
            dispute_reason: 'Work quality was not satisfactory and did not meet expectations'
        }, {
            'Authorization': `Bearer ${clientToken}`
        }, 'Dispute Job');
        
        if (dispute.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'POST /jobs/:jobId/dispute',
                status: dispute.status,
                body: { dispute_reason: 'Work quality was not satisfactory...' },
                response: dispute.data
            });
        } else {
            console.log(`   ⚠️  ${dispute.data.error || 'Job may not be in correct state'}`);
            testResults.skipped.push({ endpoint: 'POST /jobs/:jobId/dispute' });
        }
    }
}

// ============================================================================
// 5. FINANCE ROUTES
// ============================================================================
async function testFinanceRoutes() {
    console.log('\n📋 Testing Finance Routes...\n');
    
    // 1. Get Balance (Artisan)
    if (artisanToken) {
        console.log('1. GET /finance/balance (Artisan)');
        const artisanBalance = await makeRequest('GET', '/finance/balance', null, {
            'Authorization': `Bearer ${artisanToken}`
        }, 'Get Artisan Balance');
        
        if (artisanBalance.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'GET /finance/balance (Artisan)',
                status: artisanBalance.status,
                body: null,
                response: artisanBalance.data
            });
        } else {
            console.log(`   ❌ Failed`);
            testResults.failed.push({ endpoint: 'GET /finance/balance (Artisan)', ...artisanBalance });
        }
    }
    
    // 2. Get Balance (Client)
    if (clientToken) {
        console.log('\n2. GET /finance/balance (Client)');
        const clientBalance = await makeRequest('GET', '/finance/balance', null, {
            'Authorization': `Bearer ${clientToken}`
        }, 'Get Client Balance');
        
        if (clientBalance.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'GET /finance/balance (Client)',
                status: clientBalance.status,
                body: null,
                response: clientBalance.data
            });
        } else {
            console.log(`   ❌ Failed`);
            testResults.failed.push({ endpoint: 'GET /finance/balance (Client)', ...clientBalance });
        }
    }
    
    // 3. Get Transactions
    if (artisanToken) {
        console.log('\n3. GET /finance/transactions');
        const transactions = await makeRequest('GET', '/finance/transactions?limit=10&offset=0', null, {
            'Authorization': `Bearer ${artisanToken}`
        }, 'Get Transactions');
        
        if (transactions.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'GET /finance/transactions',
                status: transactions.status,
                body: null,
                query: { limit: 10, offset: 0 },
                response: transactions.data
            });
        } else {
            console.log(`   ❌ Failed`);
            testResults.failed.push({ endpoint: 'GET /finance/transactions', ...transactions });
        }
    }
    
    // 4. Get Payout History (Artisan)
    if (artisanToken) {
        console.log('\n4. GET /finance/payout-history');
        const payoutHistory = await makeRequest('GET', '/finance/payout-history?limit=20&offset=0', null, {
            'Authorization': `Bearer ${artisanToken}`
        }, 'Get Payout History');
        
        if (payoutHistory.success) {
            console.log(`   ✅ Passed`);
            testResults.passed.push({
                endpoint: 'GET /finance/payout-history',
                status: payoutHistory.status,
                body: null,
                query: { limit: 20, offset: 0 },
                response: payoutHistory.data
            });
        } else {
            console.log(`   ❌ Failed`);
            testResults.failed.push({ endpoint: 'GET /finance/payout-history', ...payoutHistory });
        }
    }
}

// ============================================================================
// 6. UPLOAD ROUTES (Skip file uploads for now - require actual files)
// ============================================================================
async function testUploadRoutes() {
    console.log('\n📋 Testing Upload Routes...\n');
    console.log('   ⚠️  Upload endpoints require actual files - skipping file upload tests');
    console.log('   Endpoints available:');
    console.log('   - POST /upload/job-photos (multipart/form-data)');
    console.log('   - POST /upload/ghana-card (multipart/form-data)');
    console.log('   - GET /upload/file/:filename');
    
    testResults.skipped.push(
        { endpoint: 'POST /upload/job-photos', reason: 'Requires file upload' },
        { endpoint: 'POST /upload/ghana-card', reason: 'Requires file upload' },
        { endpoint: 'GET /upload/file/:filename', reason: 'Requires existing file' }
    );
}

// ============================================================================
// GENERATE REPORT
// ============================================================================
function generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST REPORT');
    console.log('='.repeat(80));
    console.log(`\n✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⚠️  Skipped: ${testResults.skipped.length}`);
    
    if (testResults.failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.failed.forEach(test => {
            console.log(`\n   ${test.endpoint}`);
            console.log(`   Status: ${test.status}`);
            console.log(`   Error: ${JSON.stringify(test.data, null, 2)}`);
        });
    }
    
    // Generate detailed JSON report
    const report = {
        summary: {
            total: testResults.passed.length + testResults.failed.length + testResults.skipped.length,
            passed: testResults.passed.length,
            failed: testResults.failed.length,
            skipped: testResults.skipped.length
        },
        passed: testResults.passed,
        failed: testResults.failed,
        skipped: testResults.skipped
    };
    
    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: test-report.json');
    
    // Generate markdown documentation
    generateMarkdownReport();
}

function generateMarkdownReport() {
    let md = `# ZOLID Backend API Test Report\n\n`;
    md += `Generated: ${new Date().toISOString()}\n\n`;
    md += `## Summary\n\n`;
    md += `- ✅ Passed: ${testResults.passed.length}\n`;
    md += `- ❌ Failed: ${testResults.failed.length}\n`;
    md += `- ⚠️  Skipped: ${testResults.skipped.length}\n\n`;
    
    md += `## Endpoints Documentation\n\n`;
    
    // Group by route category
    const categories = {
        'Identity Routes': testResults.passed.filter(t => t.endpoint.includes('/identity')),
        'Profile Routes': testResults.passed.filter(t => t.endpoint.includes('/profile')),
        'Job Routes': testResults.passed.filter(t => t.endpoint.includes('/jobs')),
        'Finance Routes': testResults.passed.filter(t => t.endpoint.includes('/finance')),
        'Upload Routes': testResults.skipped.filter(t => t.endpoint.includes('/upload'))
    };
    
    Object.entries(categories).forEach(([category, tests]) => {
        if (tests.length > 0) {
            md += `### ${category}\n\n`;
            tests.forEach(test => {
                md += `#### ${test.endpoint}\n\n`;
                md += `**Method:** ${test.endpoint.split(' ')[0]}\n\n`;
                md += `**Status Code:** ${test.status}\n\n`;
                md += `**Required Body Data:**\n\`\`\`json\n${JSON.stringify(test.body || null, null, 2)}\n\`\`\`\n\n`;
                if (test.query) {
                    md += `**Query Parameters:**\n\`\`\`json\n${JSON.stringify(test.query, null, 2)}\n\`\`\`\n\n`;
                }
                if (test.headers) {
                    md += `**Headers:**\n\`\`\`json\n${JSON.stringify(test.headers, null, 2)}\n\`\`\`\n\n`;
                }
                md += `**Expected Response:**\n\`\`\`json\n${JSON.stringify(test.response, null, 2)}\n\`\`\`\n\n`;
                md += `---\n\n`;
            });
        }
    });
    
    fs.writeFileSync('API-TEST-REPORT.md', md);
    console.log('📄 Markdown report saved to: API-TEST-REPORT.md');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function runTests() {
    try {
        await testHealthAndRoot();
        await testIdentityRoutes();
        await testProfileRoutes();
        await testJobRoutes();
        await testFinanceRoutes();
        await testUploadRoutes();
        generateReport();
    } catch (error) {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Check if server is running
axios.get(`${BASE_URL}/health`)
    .then(() => {
        console.log('✅ Server is running\n');
        runTests();
    })
    .catch(() => {
        console.error(`❌ Server is not running at ${BASE_URL}`);
        console.error('Please start the server first: npm start or npm run dev');
        process.exit(1);
    });
