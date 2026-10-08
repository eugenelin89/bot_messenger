# Your first BotSquad assignment

*Give the team a small job, watch it work, and read the answer.*

For this exercise, you will ask BotSquad to **prepare a short explanation of what it can do**. You will meet the team and learn the controls as you use them.

Start with BotSquad already open in your browser. Need help getting there? Follow [Open the BotSquad UI](../operations/ACCESS_AND_OPERATIONS.md#open-the-botsquad-ui), then return here.

The button names below follow the current repository interface. Your installed version may look slightly different. This is an instructional walkthrough, not a record of a completed run on your server.

## 1. Meet Atlas: the person you give the job to

Look for **Atlas** in the team list.

Atlas is an **AI worker** — a named AI team member with a particular responsibility. BotSquad also calls these workers *bots*.

Atlas's responsibility is to coordinate the team. His title, **CEO**, means chief executive officer. For now, think of him as **your team manager: you tell him what you need, and he organizes the work**.

When Atlas is already listed, there is nothing to set up. When you see **Initialize Atlas** instead, click it. Here, "initialize" simply means setting up that first team member.

### Before continuing: is the team paused?

Find the button that says either **Pause new dispatch** or **Resume dispatch**.

*Dispatch* means **starting work that is waiting**.

When the button says **Pause new dispatch**, starting work is enabled. Leave it alone.

When it says **Resume dispatch**, starting work is paused. Before resuming, open **Tasks**, which is the list of assigned jobs, and check for older work waiting to start. **Resuming applies to the whole team, not just this tutorial.** Resume only when you are comfortable letting that waiting work start.

## 2. Open the place where you give instructions

Click **Executive channel**.

Despite the formal name, this is simply **the main place where you give Atlas instructions and read updates about the team's work**.

Find the text box labelled:

> **TO ATLAS · CEO**

Inside it, you should see:

> What should the company work on?

This is where you describe the result you want. BotSquad calls that an **objective**.

For example, "Prepare a short explanation of BotSquad" is an objective. You are describing what should be accomplished, rather than clicking through every action yourself.

## 3. Give Atlas a small, clear objective

For this exercise, we will ask Atlas to involve **Scout**.

Scout is the team's research worker. Think of the arrangement this way: **Atlas organizes the job; Scout reads and gathers information; Atlas reviews the findings and reports back.** This research workflow is supported by BotSquad.

Paste this into the text box:

```text
Atlas, please ask Scout to read the BotSquad documents
that the team is allowed to access.

Have Scout prepare a short beginner's guide covering:
1. What BotSquad can do today.
2. What is still planned for the future.
3. One simple example of how I could use it.

Review Scout's findings and give me a final answer
in plain English, under 300 words.

This is a reading-and-writing exercise only.
Do not change the software, install anything, or
publish anything externally. You may save the
written report with the assignment.
```

We are deliberately keeping the job small. It has a clear subject, a clear finished result, and clear limits.

Now click **Assign objective ↗**.

### What did that button do?

You have turned your instruction into a **task**.

A task is **a recorded job**. BotSquad keeps track of who is responsible for it, its progress, and its result.

The nearby **Send message only** button does something different: it leaves a note without starting a task. For this exercise, you want **Assign objective ↗**.

## 4. Watch Atlas pass the work to Scout

Stay in **Executive channel** and look for new messages.

The expected sequence is:

**You give Atlas the job → Atlas asks Scout to research → Scout returns findings → Atlas reports back.**

The actual messages may use different wording. You are looking for evidence that the work was assigned, carried out, and returned — not a particular script. The Executive channel is intended to show readable progress and handoff messages.

A message saying "I will get started" is an acknowledgement, not the finished result.

### Now open Tasks

Click **Tasks** to see the jobs rather than just the conversation.

You should look for your original assignment to Atlas and, if delegation has happened, a smaller assignment to Scout.

That smaller assignment is called a **child task**: a job created as part of a larger job. Two related tasks do not necessarily mean your request was submitted twice. Atlas can be responsible for the overall answer while Scout is responsible for the research.

Click **Inspect task** on your assignment. "Inspect" simply means **open its details**.

You can now see the recorded assignment, its result when available, and information about the work performed. A task marked **queued** is waiting to start; **completed** means it has been recorded as finished. If it is **blocked**, read the blocking reason rather than immediately submitting the same request again. For example, Atlas may be waiting for Scout's child task to finish; waiting for another worker is not automatically a failure.

## 5. Find and read the finished answer

Return to **Executive channel** and look for Atlas's final response.

Then open **Tasks → Inspect task** on your original assignment to check its result.

You may see a section called **Artifacts**.

An **artifact** is simply **a saved piece of work** — for example, the written report Scout produced. The message might summarize the result, while the artifact contains the saved report.

Click the report's title or artifact button to open it. Check Scout's child task too if the report is not attached to Atlas's task. The task inspector provides links to artifacts associated with that particular task.

**You have completed the exercise when the original assignment is marked completed and you can read the requested explanation.**

Read the answer as well as checking its status. Does it distinguish existing features from future plans? Is it understandable? A "completed" label is not a substitute for checking the work.

## 6. Take one optional look behind the scenes

Now that you have seen the result, click **Executions**.

An **execution** is **one recorded attempt by an AI worker to do some work**. Think of it as a work session.

Here is how that differs from a task:

> **Task:** "Prepare my beginner's guide."
>
> **Execution:** "Atlas worked on that assignment on this occasion."

Atlas might work once to delegate the research, then work again after Scout finishes. Those would be separate executions contributing to the same overall task. The Executions screen records worker activity, including attempts that finish, fail, or are interrupted.

You do not need to monitor this screen for every assignment. It becomes useful when you wonder, **"Who actually worked on this?"** or **"Why hasn't my answer arrived?"**

## If the answer does not arrive

If nothing starts, check that you clicked **Assign objective ↗**, not **Send message only**, and check whether starting work is paused. Remember that resuming can start other waiting work too.

If a task fails or reports a blocking reason, open **Inspect task** and **Executions** to read the details and check for any existing result before retrying. Do not repeatedly submit the same request to try to make it start.

For connection or service problems, see [Access and Operations](../operations/ACCESS_AND_OPERATIONS.md). This tutorial does not require changing the software, provisioning engineering access, or publishing anything externally.

## What you just learned by doing

You gave **Atlas**, your AI team manager, an **objective**. Clicking **Assign objective** created a tracked **task**. Scout could receive a smaller **child task**. Their work happened through **executions**, and a saved report could appear as an **artifact**.

For everyday use, the path is simpler than all those names:

**Tell Atlas what you need → follow the progress → read and check the result.**

---

### Documentation references

This guide covers only the task-based research workflow. Direct conversations, working groups, mandates/scheduling, bounded Computer Use and supervised business operations have separate tutorials and acceptance records; see the [milestone index](../../prompts/milestones/README.md). Interface labels and behaviour are based on the [web UI source](../../public/app.js), [current repository overview](../../README.md), and [operator guide](../operations/ACCESS_AND_OPERATIONS.md). The source reference at the time of writing was commit `542a867dcd3d7e61fff2be7d47425f4f11af8ec2` (Prompt 07-era interface).

[Back to tutorials](README.md)
