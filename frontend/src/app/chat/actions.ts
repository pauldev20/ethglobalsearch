'use server'

import { ChatResponse, queryChat } from "@/lib/api";

export const sendChatMessage = async (query: string): Promise<ChatResponse> => {
	try {
		const response = await queryChat(query);
		return response;
	} catch (error) {
		console.error("Server action error:", error);
		throw new Error("Failed to get chat response");
	}
}