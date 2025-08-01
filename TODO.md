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

