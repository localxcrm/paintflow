import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { aiTools, searchLeads, getLeadDetails, searchJobs, getBusinessStats } from '@/lib/ai-tools';

// Initialize OpenAI client
export async function POST(req: NextRequest) {
    try {
        const { messages, strategyContext } = await req.json();

        // Initialize OpenAI client inside request to ensure fresh env variables
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        console.log('Received chat message with strategy context.');

        // Format strategy context for the system prompt
        let strategyPrompt = "";
        if (strategyContext) {
            const { vto, rocks } = strategyContext;
            strategyPrompt = `
BUSINESS STRATEGY CONTEXT (NORTH STAR):
- Core Values: ${vto?.coreValues || 'Not defined'}
- Core Focus: ${vto?.coreFocus || 'Not defined'}
- 10-Year Target: ${vto?.tenYearTarget || 'Not defined'}
- 3-Year Picture: ${vto?.threeYearPicture || 'Not defined'}
- Annual Revenue Goal: ${vto?.annualTarget ? `R$ ${vto.annualTarget.toLocaleString('pt-BR')}` : 'Not defined'}

QUARTERLY ROCKS (GOALS):
${rocks?.map((r: any) => `- [${r.status}] ${r.title} (Owner: ${r.owner}, Progress: ${r.progress}%)`).join('\n') || 'No rocks defined.'}
`;
        }

        // 1. Initial Call to OpenAI to decide if tools are needed
        const runner = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview', // Or gpt-3.5-turbo if cost is a concern
            messages: [
                {
                    role: 'system',
                    content: `You are the PaintFlow Business Assistant. You have access to the company's real-time data and business strategy.
          
          ${strategyPrompt}

          GUIDELINES:
          - Use the BUSINESS STRATEGY CONTEXT to answer questions about goals, vision, values, and rocks.
          - Always use the provided tools to answer questions about leads, jobs, or business stats.
          - If a user asks for a specific lead, try searching for them first if you don't have an ID.
          - Be professional, concise, and helpful.
          - Answer in the same language as the user (DETECT LANGUAGE, usually Portuguese).
          
          Currency is usually BRL (R$). Dates should be formatted in localized Portuguese format.`
                },
                ...messages
            ],
            tools: aiTools,
            tool_choice: 'auto',
        });

        const responseMessage = runner.choices[0].message;

        // 2. Check if OpenAI wants to call a tool
        if (responseMessage.tool_calls) {
            console.log('Tool call requested:', responseMessage.tool_calls.length);

            const debugMessages: any[] = [...messages, responseMessage]; // Add assistant's tool-call request to history

            for (const toolCall of responseMessage.tool_calls) {
                const tc = toolCall as any;
                const functionName = tc.function.name;
                const functionArgs = JSON.parse(tc.function.arguments);

                console.log(`Executing ${functionName} with args:`, functionArgs);

                let toolResult = null;

                if (functionName === 'search_leads') {
                    toolResult = await searchLeads(functionArgs);
                } else if (functionName === 'get_lead_details') {
                    toolResult = await getLeadDetails(functionArgs);
                } else if (functionName === 'search_jobs') {
                    toolResult = await searchJobs(functionArgs);
                } else if (functionName === 'get_business_stats') {
                    toolResult = await getBusinessStats();
                }

                // Add tool result to history
                debugMessages.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: functionName,
                    content: JSON.stringify(toolResult),
                });
            }

            // 3. Final Call to OpenAI with tool results to generate natural language answer
            const finalResponse = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: debugMessages,
            });

            return NextResponse.json(finalResponse.choices[0].message);
        }

        // No tool call, just return the text
        return NextResponse.json(responseMessage);

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat request' },
            { status: 500 }
        );
    }
}
