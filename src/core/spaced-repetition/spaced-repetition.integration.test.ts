import { describe, beforeEach } from '@jest/globals';
import { testSpacedRepetitionUserStory } from '../spaced-repetition-user-story.generic.test';
import { InMemoryUserRepository } from '../user/user.repository.memory';
import { InMemoryDeckRepository } from '../deck/deck.repository.memory';
import { InMemoryNoteRepository } from '../note/note.repository.memory';
import { InMemoryCardRepository } from '../card/card.repository.memory';
import { InMemoryReviewRepository } from '../review/review.repository.memory';
import { DefaultSpacedRepetitionService } from './spaced-repetition.service';
import { DefaultSpacedRepetitionAlgorithmProvider } from '../../services/spaced-repetition-algorithm/providers/default-algorithm-provider';

describe('Complete Spaced Repetition System Integration', () => {
  let userRepository: InMemoryUserRepository;
  let deckRepository: InMemoryDeckRepository;
  let noteRepository: InMemoryNoteRepository;
  let cardRepository: InMemoryCardRepository;
  let reviewRepository: InMemoryReviewRepository;
  let algorithmProvider: DefaultSpacedRepetitionAlgorithmProvider;
  let spacedRepetitionService: DefaultSpacedRepetitionService;

  beforeEach(async () => {
    // Clear all repositories before each test
    userRepository = new InMemoryUserRepository();
    deckRepository = new InMemoryDeckRepository();
    noteRepository = new InMemoryNoteRepository();
    cardRepository = new InMemoryCardRepository();
    reviewRepository = new InMemoryReviewRepository();
    
    algorithmProvider = new DefaultSpacedRepetitionAlgorithmProvider();
    spacedRepetitionService = new DefaultSpacedRepetitionService(
      cardRepository,
      reviewRepository,
      deckRepository,
      algorithmProvider,
    );
  });

  testSpacedRepetitionUserStory(async () => ({
    userRepository,
    deckRepository,
    noteRepository,
    cardRepository,
    reviewRepository,
    spacedRepetitionService,
  }));
});
