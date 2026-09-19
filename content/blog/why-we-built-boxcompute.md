---
title: I got frustrated with AWS, so we built our own sandbox
slug: why-we-built-boxcompute
excerpt: At my previous company, a healthcare startup, I gave a LangGraph agent a sandbox to analyze data on its own. That experiment, and a regional availability problem, became the starting point for BoxCompute.
byline: Farhan Helmy
publishedAt: 2026-09-16
tags: Agents, Sandboxes, Building BoxCompute
---

At my previous company, a healthcare startup, we were working within the limits of the model's context window and the tools we had given it. I changed one node in our LangGraph workflow to give the agent a sandbox, where it could use pandas and other data science libraries to work through the data on its own.

That experiment became the starting point for BoxCompute.

The useful part was watching the agent research, analyze, and iterate inside a workspace. The frustrating part came when I had to use a US AWS region because the code interpreter wasn't available in the region I wanted at the time.

I wanted to keep the workspace idea and build the infrastructure behind it myself.

## The experiment inside the graph

We were building agents to help people make sense of their data. Our LangGraph workflow split the work across roles: routing a question, planning an analysis, querying data, and interpreting results. I covered that progression in my talk, [Building a Production-Grade AI Agent Harness](https://farhanhelmy.com/talks/production-agent-harness/).

At the time, context length and the available tools constrained what the agent could do. Passing more data into the conversation only went so far. And when an investigation needed an operation beyond the tools we had exposed, the agent had limited room to work it out itself.

The change started with one node. I gave the agent access to Amazon Bedrock AgentCore Code Interpreter so it could write and execute analysis code inside a sandbox. That opened up pandas and other available data science libraries as tools it could use autonomously.

The flow became roughly:

```text
User question
      ↓
Query agent prepares the data
      ↓
Agent works in a sandbox
  Write code → run it → inspect output
       ↑                       |
       └──── adjust and retry ──┘
      ↓
Result analyzer explains the findings
```

The sandbox gave the agent somewhere to do the analysis between receiving the data and returning an answer. It could choose operations, write the code to perform them, inspect the output, and decide what to try next. I didn't have to expose every possible data transformation as a separate tool first.

That was the part that stayed with me: **I could give the agent a task and room to work out the intermediate steps.**

## What a workspace gives an agent

Think about how you would investigate an unfamiliar CSV yourself. You might look at the columns, check the types, count missing values, and try an aggregation. The first result might raise another question, so you write a little more code. You keep the useful outputs and work toward an explanation.

A sandbox gives an agent the tools to follow that kind of process. It has files to inspect, code it can execute, and results it can use to decide what to try next.

That changes how much of the investigation you need to specify in advance. You still define the task and what the agent can access. Within that boundary, it can choose intermediate operations based on what it discovers.

That also helped with the context constraint. The dataset could stay in the workspace while code computed summaries, filtered rows, or calculated statistics. The model could inspect those smaller outputs and decide on the next calculation. The working data remained available without needing every row in the conversation.

The context window still mattered: the agent needed enough information to decide what to do next. But now it could use code to examine the data a piece at a time and keep intermediate artifacts in the workspace. Returning focused outputs was part of making that useful.

This was the kind of autonomy I wanted: enough freedom to investigate the task inside a controlled environment.

## Then I hit regional availability

For that experiment, I used Amazon Bedrock AgentCore Code Interpreter. It helped me try the idea, but it wasn't available in the region I wanted at the time. I ended up using a US region.

Building from Malaysia, that was frustrating. A new capability can be available somewhere and still be unavailable where you need it. You can read the announcement, understand exactly how it would help, and still have to work around the rollout.

The experiment had already convinced me that a workspace was useful. I wanted more control over how I provided one, including where I could run it.

That frustration was part of what pushed me to build BoxCompute from scratch and move away from depending on that managed code interpreter.

## Why we built BoxCompute

Once I had seen the pattern work inside an existing agent, I wanted to make the workspace itself something I could build around.

The goal behind BoxCompute is to give agents a place to execute code, work with files, and carry a task through multiple steps. The application gives the agent a job. The workspace holds the material and tools it needs to do that job.

Building that infrastructure myself also means taking responsibility for it: starting environments, managing their resources, collecting output, and cleaning them up. That is real work. It is also the part I chose to own so I could shape the runtime around the agents I wanted to build.

The lesson I took from that experience was practical. You can start with a single part of an existing workflow. Give the agent working data, an execution environment, and a clear task. Then look at what it actually does with that room.

For me, that one experiment led to BoxCompute. I wanted to keep giving agents a workspace, without waiting for the next regional rollout to decide when I could use it.
