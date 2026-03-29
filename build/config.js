import "dotenv/config";
export function getRequiredApiKey(env = process.env) {
    const apiKey = env.BLAZE_API_KEY?.trim();
    if (!apiKey) {
        throw new Error("BLAZE_API_KEY environment variable is not set. Create a .env file based on .env.sample.");
    }
    return apiKey;
}
