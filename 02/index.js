import {ChatGroq} from "@langchain/groq";
import dotenv from "dotenv";
import rl from "readline/promises";
import { tool, createAgent } from "langchain";
import z from "zod";
import { StateGraph, START, END} from "@langchain/langgraph"

dotenv.config();

const events=[]

const createEventTool=tool(
    async function({date, title, description}) {
        console.log(`Creating event: ${date}, ${title}, ${description}`);
        events.push({date, title, description})
        return "Event created successfully!!!!!!!!!!!!\n"
    },
    {
        name: "create_event",
        description: "Create an event with a date, title, and description.",
        schema: z.object({
            date: z.string().describe("The date of the event in YYYY-MM-DD format."),
            title: z.string().describe("The title of the event."),
            description: z.string().describe("A brief description of the event."),
        }),
    }
)

const getEventsTool=tool(
    async function({}) {
        console.log(`Retrieving all events..........`,events);
        return events
    },
    {
        name: "get_events",
        description: "Retrieve all events.",
        schema: z.object({}),
    }
)

const readline = rl.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-120b",
});

// ---------------------llm node----------------------------
async function LLMNode(state) {
    console.log("LLMNode executed",state);
    return {
        messages: [
            ...state.messages,
            {
                role: "assistant",
                content: "Hello! How can I assist you today?"
            }
        ]
    }
}

const graph = new StateGraph(
    z.object({
        messages: z.array(z.any())
    })
)
.addNode("LLMNode", LLMNode)
.addEdge(START, "LLMNode")
.addEdge("LLMNode", END)
.compile()

const graphResult = await graph.invoke({
    messages: [
        {
            role: "user",
            content: "Hello, I would like to create an event."
        }
    ]
})
console.log("Graph result:", graphResult);