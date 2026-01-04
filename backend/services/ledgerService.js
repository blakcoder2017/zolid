const financeService = require('./financeService');

class LedgerService {
    
    static async post(transactionRef, accountName, amountPesewas, direction) {
        const txData = {
            reference_id: transactionRef,
            description: `Ledger posting: ${direction} ${accountName}`,
            metadata: {},
            postings: [
                {
                    account_name: accountName,
                    amount_pesewas: amountPesewas,
                    direction: direction
                }
            ]
        };
        
        // Note: This requires an active database client with transaction
        // The calling code should pass the client
        throw new Error('LedgerService.post() requires a database client. Use the static method with client parameter.');
    }
    
    static async postWithClient(client, transactionRef, accountName, amountPesewas, direction) {
        const txData = {
            reference_id: transactionRef,
            description: `Ledger posting: ${direction} ${accountName}`,
            metadata: {},
            postings: [
                {
                    account_name: accountName,
                    amount_pesewas: amountPesewas,
                    direction: direction
                }
            ]
        };
        
        return await financeService.postAtomicTransaction(client, txData);
    }
}

module.exports = LedgerService;