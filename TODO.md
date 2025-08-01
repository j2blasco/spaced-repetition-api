* TODO:
combine instructions with memory mcp

* add infra

* create modified version of sm2 algorithm which has an option "options: failedCards: { repeatBeforeGrade: n }" which should keep an internal repeatFailed state before grading a card as failed when failing a card.
Currently, when a card is faild, it can be scheduled into the future, but before rescheduling to the future we want to for the user to repeat recalling it n times. So the card should have a isFailed internal state, and some kind of variable that keeps track of the correct recalls before grading it as faild.

That is:

optiosn repeatBeforeFailGrade: 4

new card

review card as easy -> scheduled into the future
review card as failed -> scheduled for now (This ward will be graded as failed, 4 non failed recalls needed before grading)
review card as easy -> scheduled for now (This ward will be graded as failed, 3 non failed recalls needed before grading)
review card as easy -> scheduled for now (This ward will be graded as failed, 2 non failed recalls needed before grading)
review card as failed -> scheduled for now (This ward will be graded as failed, 3 non failed recalls needed before grading)
review card as easy -> scheduled for now (This ward will be graded as failed, 2 non failed recalls needed before grading)
review card as easy -> scheduled for now (This ward will be graded as failed, 1 non failed recalls needed before grading)
review card as easy -> scheduled for now (The card is now graded as failed and rescheulded to whatever the algorithm says)



* create user mcp should throw error if preferences are wrong
/ TODO: verify that the implementation works
Ran Create User – spaced-repetition (MCP Server)

Input
json
Copy
Edit
{
  "preferences": {
    "defaultAlgorithm": "modified-sm2",
    "maxNewCardsPerDay": 10,
    "maxReviewsPerDay": 50,
    "timezone": "UTC"
  }
}
Output
makefile
Copy
Edit
User created successfully:
ID: 6dd4d83e-3f67-4f5f-a63e-db5906b0839c
Created: 2025-08-01T06:29:21.468Z
Preferences: {
  "maxNewCardsPerDay": 10,
  "maxReviewsPerDay": 50,
  "defaultAlgorithm": "modified-sm2",
  "timezone": "UTC"
}

In thi sexample, modified-sm2 is not a valid algorithm


* clean up this endpoints, what is a study session in the mcp?
Or maybe the studio session is useful? Review how it works

✅ Ran Create Study Session – spaced-repetition (MCP Server)

Input
json
Copy
Edit
{
  "userId": "b9e33fab-5606-4e1a-9440-e150c8ffabe3",
  "tags": [
    "spanish"
  ]
}
Output
yaml
Copy
Edit
Study session created:
Total due cards: 3
Cards in session:
- 50c30c75-4247-4a6f-9a78-1d7f81da10b0: spanish, vocabulary, nouns, beginner (Due: 2025-08-01T06:34:02.953Z)
- 3e9f98bf-2ba6-408c-84fc-12b266bc27b7: spanish, vocabulary, verbs, beginner (Due: 2025-08-01T06:34:03.013Z)
- 2c0967e6-d955-4840-a52a-f9214ea16373: spanish, vocabulary, colors, adjectives, beginner (Due: 2025-08-01T0