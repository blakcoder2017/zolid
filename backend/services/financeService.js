const { v4: uuidv4 } = require('uuid');

// --- CONSTANTS: The Chart of Accounts (F.S.1 Integrity) ---
const CHART_OF_ACCOUNTS = [
    // LIABILITY ACCOUNTS (Money we owe others/hold for others)
    // 1. Escrow Liability (The Moat pool)
    { name: "MoMo_Escrow_Liability", type: "LIABILITY", code: "1100" },
    // 2. Payables (Money owed to third parties, including Artisans)
    { name: "Payable_Artisan_Net", type: "LIABILITY", code: "2101" },
    { name: "Payable_RiviaCo_Premium", type: "LIABILITY", code: "2102" },
    
    // REVENUE ACCOUNTS (Platform Income)
    { name: "Revenue_Warranty_Fee", type: "REVENUE", code: "4001" },
    { name: "Revenue_Artisan_Commission", type: "REVENUE", code: "4002" },
    
    // ASSET ACCOUNTS (Money we own or control)
    { name: "Asset_Platform_Cash", type: "ASSET", code: "1001" },
    { name: "Asset_Paystack_Holding", type: "ASSET", code: "1002" }, 
    
    // EXPENSE ACCOUNTS
    { name: "Expense_Paystack_Fees", type: "EXPENSE", code: "6001" },
    { name: "Expense_Warranty_Payouts", type: "EXPENSE", code: "6002" },
];

/**
 * Initializes the required accounts in the PostgreSQL database. (Used by db/setup.js)
 * @param {object} client - The PG client instance.
 */
async function setupChartOfAccounts(client) {
    console.log("FINANCE: Starting Chart of Accounts initialization...");
    for (const account of CHART_OF_ACCOUNTS) {
        const sql = `
            INSERT INTO accounts (name, type, code, currency) 
            VALUES ($1, $2, $3, 'GHS')
            ON CONFLICT (code) DO NOTHING;
        `;
        // We assume the accounts table is already created by the DDL
        await client.query(sql, [account.name, account.type, account.code]);
    }
}

/**
 * Retrieves the account UUID by name.
 * @param {object} client - The PG client instance.
 * @param {string} accountName - The unique name of the account.
 */
async function getAccountId(client, accountName) {
    const sql = "SELECT id FROM accounts WHERE name = $1;";
    const result = await client.query(sql, [accountName]);
    if (!result.rows.length) {
        throw new Error(`Account name '${accountName}' not found in Chart of Accounts.`);
    }
    return result.rows[0].id;
}

/**
 * F.S.1 - Posts a balanced, atomic transaction to the Ledger.
 * @param {object} client - The PG client instance (must be part of a transaction).
 * @param {object} txData - The TransactionPost data structure from Job Service.
 * @returns {string} The UUID of the new transaction header.
 */
async function postAtomicTransaction(client, txData) {
    // 1. Integrity Check (Ensures Debits = Credits)
    let netSum = 0;
    for (const p of txData.postings) {
        if (p.direction === 'DEBIT') netSum += p.amount_pesewas;
        else if (p.direction === 'CREDIT') netSum -= p.amount_pesewas;
    }
    if (netSum !== 0) {
        // CRITICAL ERROR - If this fails, the DB transaction MUST ROLLBACK
        throw new Error(`Transaction ${txData.reference_id} is unbalanced. Net sum: ${netSum}`);
    }

    // 2. Insert Transaction Header (The Event)
    const txSql = `
        INSERT INTO transactions (reference_id, description, metadata)
        VALUES ($1, $2, $3) RETURNING id;
    `;
    const txResult = await client.query(txSql, [
        txData.reference_id, 
        txData.description, 
        txData.metadata
    ]);
    const transactionId = txResult.rows[0].id;

    // 3. Insert Postings (The Movement)
    const postingSql = `
        INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction)
        VALUES ($1, $2, $3, $4);
    `;

    for (const posting of txData.postings) {
        // F.S.1: Get the account UUID by name
        const accountId = await getAccountId(client, posting.account_name);
        
        await client.query(postingSql, [
            transactionId,
            accountId,
            posting.amount_pesewas,
            posting.direction
        ]);
    }

    return transactionId;
}

module.exports = {
    setupChartOfAccounts,
    postAtomicTransaction,
    getAccountId,
};