"use server";

import { ChatResponse } from "@/lib/api";
import { getChatResponse } from "@/lib/chat-service";

export const sendChatMessage = async (query: string): Promise<ChatResponse> => {
	try {
		return await getChatResponse(query);
	} catch (error) {
		console.error("Server action chat error:", error);
		throw new Error("Failed to get chat response");
	}
};
