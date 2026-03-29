function truncateText(value, maxChars) {
    if (value.length <= maxChars) {
        return { text: value, wasTruncated: false };
    }
    return {
        text: `${value.slice(0, Math.max(0, maxChars - 26))}\n... [output truncated]`,
        wasTruncated: true,
    };
}
function stringifyJson(value) {
    try {
        return JSON.stringify(value ?? {}, null, 2);
    }
    catch {
        return JSON.stringify({
            error: "Unable to serialize BlazeSQL data_result as JSON.",
        }, null, 2);
    }
}
export function formatBlazeSqlSuccess(result, maxResponseChars) {
    const agentResponse = truncateText(result.agent_response, Math.max(400, Math.floor(maxResponseChars * 0.25)));
    const generatedSql = truncateText(result.query ?? "-- No SQL query returned", Math.max(400, Math.floor(maxResponseChars * 0.25)));
    const dataResult = truncateText(stringifyJson(result.data_result ?? {}), Math.max(800, Math.floor(maxResponseChars * 0.5)));
    return {
        text: `**Agent Response:**\n${agentResponse.text}\n\n**Generated SQL:**\n\`\`\`sql\n${generatedSql.text}\n\`\`\`\n\n**Data Result (JSON):**\n\`\`\`json\n${dataResult.text}\n\`\`\`\n`,
        wasTruncated: agentResponse.wasTruncated ||
            generatedSql.wasTruncated ||
            dataResult.wasTruncated,
    };
}
