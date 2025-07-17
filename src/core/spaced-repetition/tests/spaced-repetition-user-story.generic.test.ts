import {
  SpacedRepetitionService,
  StudySession,
  ReviewCardRequest,
} from '../spaced-repetition.service.interface.js';
import { ICardRepository, CreateCardRequest } from '../card/card.interface.js';
import { DeckRepository, CreateDeckRequest } from '../deck/deck.interface.js';
import { NoteRepository, CreateNoteRequest } from '../note/note.interface.js';
import { ReviewRepository } from '../review/review.interface.js';
import {
  UserRepository,
  CreateUserRequest,
} from 'src/core/user/user.interface.js';

/**
 * Generic test suite for the complete spaced repetition user story
 * This test verifies that implementations can handle the full workflow:
 * 1. User creates a deck
 * 2. User adds notes and cards to the deck
 * 3. User studies cards and reviews them
 * 4. System properly schedules cards for future reviews
 */
export function testSpacedRepetitionUserStory(
  createRepositories: () => Promise<{
    userRepository: UserRepository;
    deckRepository: DeckRepository;
    noteRepository: NoteRepository;
    cardRepository: ICardRepository;
    reviewRepository: ReviewRepository;
    spacedRepetitionService: SpacedRepetitionService;
  }>,
) {
  describe('Spaced Repetition User Story', () => {
    let userRepository: UserRepository;
    let deckRepository: DeckRepository;
    let noteRepository: NoteRepository;
    let cardRepository: ICardRepository;
    let reviewRepository: ReviewRepository;
    let spacedRepetitionService: SpacedRepetitionService;

    beforeEach(async () => {
      const repositories = await createRepositories();
      userRepository = repositories.userRepository;
      deckRepository = repositories.deckRepository;
      noteRepository = repositories.noteRepository;
      cardRepository = repositories.cardRepository;
      reviewRepository = repositories.reviewRepository;
      spacedRepetitionService = repositories.spacedRepetitionService;
    });

    it('should complete a full user story: create deck, add cards, study, and review', async () => {
      // 1. Create a user
      const createUserRequest: CreateUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        preferences: {
          dailyNewCards: 20,
          maxReviews: 100,
          timezone: 'UTC',
          defaultAlgorithm: 'sm2',
        },
      };

      const user = await userRepository.create(createUserRequest);
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');

      // 2. Create a deck
      const createDeckRequest: CreateDeckRequest = {
        userId: user.id,
        name: 'Spanish Vocabulary',
        description: 'Basic Spanish words for beginners',
        tags: ['spanish', 'vocabulary'],
        isPublic: false,
        defaultAlgorithm: 'sm2',
      };

      const deck = await deckRepository.create(createDeckRequest);
      expect(deck.name).toBe('Spanish Vocabulary');
      expect(deck.userId).toEqual(user.id);
      expect(deck.cardCount).toBe(0);

      // 3. Add notes to the deck
      const notes = [];
      const noteData = [
        { front: 'Hello', back: 'Hola' },
        { front: 'Goodbye', back: 'Adiós' },
        { front: 'Thank you', back: 'Gracias' },
      ];

      for (const data of noteData) {
        const createNoteRequest: CreateNoteRequest = {
          deckId: deck.id,
          fields: {
            front: data.front,
            back: data.back,
          },
          tags: ['basic'],
        };

        const note = await noteRepository.create(createNoteRequest);
        notes.push(note);
      }

      expect(notes).toHaveLength(3);

      // 4. Create cards from notes
      const cards = [];
      for (const note of notes) {
        const createCardRequest: CreateCardRequest = {
          noteId: note.id,
          deckId: deck.id,
          cardType: 'basic',
          front: note.fields.front,
          back: note.fields.back,
          algorithm: 'sm2',
        };

        const card =
          await spacedRepetitionService.createCard(createCardRequest);
        cards.push(card);
        expect(card.scheduling.nextReviewDate).toBeInstanceOf(Date);
      }

      expect(cards).toHaveLength(3);

      // 5. Get study session (should include all new cards)
      const studySession: StudySession = {
        userId: user.id,
        deckId: deck.id,
        maxCards: 10,
        includeNewCards: true,
      };

      const studyResult =
        await spacedRepetitionService.getStudySession(studySession);
      expect(studyResult.newCards).toHaveLength(3);
      expect(studyResult.dueCards).toHaveLength(0); // No cards are due yet
      expect(studyResult.totalCards).toBe(3);

      // 6. Review cards with different responses
      const reviewResponses: Array<'again' | 'hard' | 'good' | 'easy'> = [
        'good',
        'easy',
        'hard',
      ];

      for (let i = 0; i < cards.length; i++) {
        const reviewRequest: ReviewCardRequest = {
          cardId: cards[i].id,
          userId: user.id,
          response: reviewResponses[i],
          responseTime: 5.0,
        };

        const reviewResult =
          await spacedRepetitionService.reviewCard(reviewRequest);

        expect(reviewResult.review.response).toBe(reviewResponses[i]);
        expect(reviewResult.review.cardId).toEqual(cards[i].id);
        expect(reviewResult.updatedCard.id).toEqual(cards[i].id);

        // Card should have updated scheduling
        expect(
          reviewResult.updatedCard.scheduling.lastReviewDate,
        ).toBeInstanceOf(Date);
        expect(
          reviewResult.updatedCard.scheduling.nextReviewDate,
        ).toBeInstanceOf(Date);
      }

      // 7. Verify reviews were stored
      const userReviews = await reviewRepository.findByUserId(user.id);
      expect(userReviews).toHaveLength(3);

      // 8. Check that cards are no longer immediately due
      const dueCards = await spacedRepetitionService.getDueCards(
        user.id,
        deck.id,
      );
      expect(dueCards).toHaveLength(0); // Cards should be scheduled for future

      // 9. Verify deck statistics were updated
      const updatedDeck = await deckRepository.findById(deck.id);
      expect(updatedDeck).not.toBeNull();
      expect(updatedDeck!.reviewsToday).toBe(3);
    });

    it('should handle cards becoming due for review', async () => {
      // Create user and deck
      const user = await userRepository.create({
        username: 'testuser2',
        email: 'test2@example.com',
      });

      const deck = await deckRepository.create({
        userId: user.id,
        name: 'Test Deck',
        description: 'Test deck for due cards',
      });

      // Create a note and card
      const note = await noteRepository.create({
        deckId: deck.id,
        fields: { front: 'Test front', back: 'Test back' },
      });

      const card = await spacedRepetitionService.createCard({
        noteId: note.id,
        deckId: deck.id,
        cardType: 'basic',
        front: note.fields.front,
        back: note.fields.back,
      });

      // Simulate time passing by manually updating the card's next review date to the past
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      await cardRepository.update(card.id, {
        scheduling: {
          ...card.scheduling,
          nextReviewDate: pastDate,
        },
      });

      // Check that the card is now due
      const isDue = await spacedRepetitionService.isCardDue(card.id);
      expect(isDue).toBe(true);

      // Get due cards
      const dueCards = await spacedRepetitionService.getDueCards(
        user.id,
        deck.id,
      );
      expect(dueCards).toHaveLength(1);
      expect(dueCards[0].id).toEqual(card.id);
    });
  });
}
