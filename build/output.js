export function formatBlazeSqlSuccess(result) {
    return `**Agent Response:**\n${result.agent_response}\n\n**Generated SQL:**\n\`\`\`sql\n${result.query ?? "-- No SQL query returned"}\n\`\`\`\n\n**Data Result (JSON):**\n\`\`\`json\n${JSON.stringify(result.data_result ?? {}, null, 2)}\n\`\`\`\n`;
}
