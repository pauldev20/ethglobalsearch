import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";

const OFFICIAL_PROVIDERS = {
    "llama-3.3-70b-instruct": "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
    "deepseek-r1-70b": "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3",
    "qwen2.5-vl-72b-instruct": "0x6D233D2610c32f630ED53E8a7Cbf759568041f8f"
};

const INITIAL_FUND_AMOUNT = 0.05; // Initial amount to add to ledger in 0G tokens (reasonable for testnet)
const MIN_BALANCE = 0.01; // Minimum balance required in 0G tokens (0.01 0G should be enough - most of the 0.4 0G is a reservation that gets returned)

export async function expandQueryWith0G(query: string): Promise<string> {
    try {
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            console.error("PRIVATE_KEY is missing");
            return query; // Fallback to original query
        }

        // Initialize Wallet and Provider
        const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
        const wallet = new ethers.Wallet(privateKey, provider);

        // Check wallet balance first (in 0G tokens)
        const walletBalance = await provider.getBalance(wallet.address);
        const walletBalance0G = parseFloat(ethers.formatEther(walletBalance));
        console.log(`Wallet balance: ${walletBalance0G} 0G`);

        // Create Broker
        const broker = await createZGComputeNetworkBroker(wallet);

        // Ensure Ledger Account with sufficient balance
        let ledgerInfo;
        try {
            ledgerInfo = await broker.ledger.getLedger();
            const currentBalance = ledgerInfo[1];
            const balanceIn0G = parseFloat(ethers.formatEther(currentBalance));
            
            console.log(`Current ledger balance: ${balanceIn0G} 0G`);
            
            // Check if balance is sufficient
            if (balanceIn0G < MIN_BALANCE) {
                console.warn(`Ledger balance (${balanceIn0G.toFixed(4)} 0G) is below minimum (${MIN_BALANCE} 0G). The request may fail if insufficient funds.`);
                // Note: To add funds to existing ledger, use the 0G dashboard or transferFund method
                // For now, we'll proceed and let the request fail with a clear error if needed
            }
        } catch (error: any) {
            // Create ledger if it doesn't exist
            // Use a smaller amount that we can afford
            const gasReserve = 0.005; // Reserve 0.005 0G for gas fees
            const availableToAdd = Math.max(0, walletBalance0G - gasReserve);
            const amountToAdd = Math.min(INITIAL_FUND_AMOUNT, availableToAdd);
            
            if (amountToAdd > 0.001) {
                console.log(`Creating new ledger with ${amountToAdd.toFixed(4)} 0G...`);
                await broker.ledger.addLedger(amountToAdd);
                console.log(`Ledger created with ${amountToAdd.toFixed(4)} 0G`);
            } else {
                console.error(`Insufficient wallet balance. Need at least 0.005 0G for gas + ledger funding. Current balance: ${walletBalance0G.toFixed(4)} 0G`);
                return query; // Fallback to original query
            }
        }

        // List Services and Select Provider
        const services = await broker.inference.listService();
        if (services.length === 0) {
            console.warn("No 0G services available");
            return query;
        }

        const selectedService = services.find((s: any) => s.provider === OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"]) || services[0];
        const selectedProvider = selectedService.provider;

        // Acknowledge Provider
        try {
            await broker.inference.acknowledgeProviderSigner(selectedProvider);
        } catch (error: any) {
            if (!error.message.includes('already acknowledged')) {
                console.warn("Provider acknowledgement failed:", error);
                // Continue?
            }
        }

        // Transfer funds to provider (try with available balance)
        // Check ledger balance first to see how much we can transfer
        try {
            const ledgerInfo = await broker.ledger.getLedger();
            const ledgerBalance = ledgerInfo[1];
            const ledgerBalance0G = parseFloat(ethers.formatEther(ledgerBalance));
            
            // Try to transfer what we have (minimum 0.01 OG, or whatever is available)
            const minTransfer = 0.01; // Try with minimum 0.01 OG
            const transferAmount = ledgerBalance0G >= minTransfer 
                ? ethers.parseEther(minTransfer.toString())
                : ledgerBalance; // Use all available if less than minimum
            
            console.log(`Attempting to transfer ${ethers.formatEther(transferAmount)} 0G to provider...`);
            await broker.ledger.transferFund(selectedProvider, "inference", transferAmount);
            console.log(`Transferred ${ethers.formatEther(transferAmount)} 0G to provider ${selectedProvider}`);
        } catch (error: any) {
            // If transfer fails, continue anyway - the request will show a clear error if provider needs more funds
            console.warn(`Transfer to provider failed or skipped: ${error.message}`);
            // Continue - the API call will fail with a clear error if funds are insufficient
        }

        // Get Service Metadata
        const { endpoint, model } = await broker.inference.getServiceMetadata(selectedProvider);

        // Generate Headers
        const headers = await broker.inference.getRequestHeaders(selectedProvider, query);
        const requestHeaders: Record<string, string> = {};
        Object.entries(headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
                requestHeaders[key] = value;
            }
        });

        // OpenAI Client
        const openai = new OpenAI({
            baseURL: endpoint,
            apiKey: "",
        });

        // Prompt
        const systemPrompt = `
      You transform a natural language request into an expanded list of search keywords.
      Your job is to:
      - extract the core concepts
      - expand them with synonyms, related categories, and domain-relevant terms
      - include both specific and broad variants
      - output 8-20 search tokens
      - avoid stopwords and filler words
      - return ONLY a comma-separated list of search keywords. No sentences.
      
      For example, if the user asks "Show me projects like Facebook",
      you should output keywords like:
      social media, messaging, social network, chat app, community platform, user profiles, feed, timeline, friends list, photo sharing, real-time updates
    `;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query }
            ],
            model: model,
        }, {
            headers: requestHeaders,
        });

        const expandedQuery = completion.choices[0].message.content?.trim() || query;
        const chatId = completion.id;

        // Process Response (Payment)
        try {
            await broker.inference.processResponse(selectedProvider, expandedQuery, chatId);
        } catch (error) {
            console.error("Payment processing failed:", error);
        }

        return expandedQuery;

    } catch (error) {
        console.error("0G Expansion Error:", error);
        return query; // Fallback
    }
}
