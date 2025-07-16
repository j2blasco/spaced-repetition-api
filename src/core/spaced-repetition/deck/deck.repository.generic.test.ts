import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  DeckRepository,
  CreateDeckRequest,
  UpdateDeckRequest,
  DeckId,
} from './deck.interface';
import { UserId } from 'src/core/user/user.interface';

/**
 * Generic test suite for DeckRepository implementations
 * Any implementation of DeckRepository should pass these tests
 */
export function testDeckRepository(
  createDeckRepository: () => Promise<DeckRepository>,
) {
  describe('DeckRepository', () => {
    let repository: DeckRepository;
    const userId1: UserId = { value: 'user-1' };
    const userId2: UserId = { value: 'user-2' };

    beforeEach(async () => {
      repository = await createDeckRepository();
    });

    describe('create', () => {
      it('should create a deck with all fields', async () => {
        const request: CreateDeckRequest = {
          userId: userId1,
          name: 'Spanish Vocabulary',
          description: 'Basic Spanish words',
          tags: ['spanish', 'vocabulary'],
          isPublic: true,
          defaultAlgorithm: 'sm2',
        };

        const deck = await repository.create(request);

        expect(deck.id.value).toBeDefined();
        expect(deck.userId).toEqual(userId1);
        expect(deck.name).toBe('Spanish Vocabulary');
        expect(deck.description).toBe('Basic Spanish words');
        expect(deck.tags).toEqual(['spanish', 'vocabulary']);
        expect(deck.isPublic).toBe(true);
        expect(deck.defaultAlgorithm).toBe('sm2');
        expect(deck.cardCount).toBe(0);
        expect(deck.newCardsToday).toBe(0);
        expect(deck.reviewsToday).toBe(0);
        expect(deck.createdAt).toBeInstanceOf(Date);
        expect(deck.updatedAt).toBeInstanceOf(Date);
      });

      it('should create a deck with minimal fields and defaults', async () => {
        const request: CreateDeckRequest = {
          userId: userId1,
          name: 'Minimal Deck',
        };

        const deck = await repository.create(request);

        expect(deck.id.value).toBeDefined();
        expect(deck.userId).toEqual(userId1);
        expect(deck.name).toBe('Minimal Deck');
        expect(deck.description).toBe('');
        expect(deck.tags).toEqual([]);
        expect(deck.isPublic).toBe(false);
        expect(deck.defaultAlgorithm).toBe('sm2');
      });
    });

    describe('findById', () => {
      it('should find existing deck by id', async () => {
        const created = await repository.create({
          userId: userId1,
          name: 'Find Test Deck',
        });

        const found = await repository.findById(created.id);

        expect(found).not.toBeNull();
        expect(found!.id).toEqual(created.id);
        expect(found!.name).toBe('Find Test Deck');
      });

      it('should return null for non-existent id', async () => {
        const nonExistentId: DeckId = { value: 'non-existent-deck' };
        const found = await repository.findById(nonExistentId);
        expect(found).toBeNull();
      });
    });

    describe('findByUserId', () => {
      it('should find all decks for a user', async () => {
        await repository.create({
          userId: userId1,
          name: 'User 1 Deck 1',
        });
        await repository.create({
          userId: userId1,
          name: 'User 1 Deck 2',
        });
        await repository.create({
          userId: userId2,
          name: 'User 2 Deck 1',
        });

        const user1Decks = await repository.findByUserId(userId1);
        const user2Decks = await repository.findByUserId(userId2);

        expect(user1Decks).toHaveLength(2);
        expect(user2Decks).toHaveLength(1);
        expect(
          user1Decks.every((deck) => deck.userId.value === userId1.value),
        ).toBe(true);
      });

      it('should return empty array for user with no decks', async () => {
        const noDecksUserId: UserId = { value: 'no-decks-user' };
        const decks = await repository.findByUserId(noDecksUserId);
        expect(decks).toEqual([]);
      });
    });

    describe('findPublicDecks', () => {
      it('should find only public decks', async () => {
        await repository.create({
          userId: userId1,
          name: 'Public Deck 1',
          isPublic: true,
        });
        await repository.create({
          userId: userId1,
          name: 'Private Deck 1',
          isPublic: false,
        });
        await repository.create({
          userId: userId2,
          name: 'Public Deck 2',
          isPublic: true,
        });

        const publicDecks = await repository.findPublicDecks();

        expect(publicDecks).toHaveLength(2);
        expect(publicDecks.every((deck) => deck.isPublic)).toBe(true);
      });

      it('should return empty array when no public decks exist', async () => {
        await repository.create({
          userId: userId1,
          name: 'Private Deck',
          isPublic: false,
        });

        const publicDecks = await repository.findPublicDecks();
        expect(publicDecks).toEqual([]);
      });
    });

    describe('update', () => {
      it('should update deck fields', async () => {
        const created = await repository.create({
          userId: userId1,
          name: 'Original Name',
          description: 'Original description',
        });

        // Small delay to ensure updatedAt is different
        await new Promise((resolve) => setTimeout(resolve, 1));

        const updateRequest: UpdateDeckRequest = {
          name: 'Updated Name',
          description: 'Updated description',
          tags: ['updated', 'tags'],
          isPublic: true,
          defaultAlgorithm: 'sm4',
        };

        const updated = await repository.update(created.id, updateRequest);

        expect(updated.id).toEqual(created.id);
        expect(updated.name).toBe('Updated Name');
        expect(updated.description).toBe('Updated description');
        expect(updated.tags).toEqual(['updated', 'tags']);
        expect(updated.isPublic).toBe(true);
        expect(updated.defaultAlgorithm).toBe('sm4');
        expect(updated.updatedAt.getTime()).toBeGreaterThan(
          created.updatedAt.getTime(),
        );
      });

      it('should update partial fields', async () => {
        const created = await repository.create({
          userId: userId1,
          name: 'Original Name',
          description: 'Original description',
        });

        const updateRequest: UpdateDeckRequest = {
          name: 'Updated Name Only',
        };

        const updated = await repository.update(created.id, updateRequest);

        expect(updated.name).toBe('Updated Name Only');
        expect(updated.description).toBe('Original description'); // unchanged
      });

      it('should throw error for non-existent deck', async () => {
        const nonExistentId: DeckId = { value: 'non-existent-deck' };
        const updateRequest: UpdateDeckRequest = {
          name: 'Updated',
        };

        await expect(
          repository.update(nonExistentId, updateRequest),
        ).rejects.toThrow();
      });
    });

    describe('delete', () => {
      it('should delete existing deck', async () => {
        const created = await repository.create({
          userId: userId1,
          name: 'Deck to Delete',
        });

        await repository.delete(created.id);

        const found = await repository.findById(created.id);
        expect(found).toBeNull();
      });

      it('should throw error when deleting non-existent deck', async () => {
        const nonExistentId: DeckId = { value: 'non-existent-deck' };
        await expect(repository.delete(nonExistentId)).rejects.toThrow();
      });
    });

    describe('exists', () => {
      it('should return true for existing deck', async () => {
        const created = await repository.create({
          userId: userId1,
          name: 'Exists Test Deck',
        });

        const exists = await repository.exists(created.id);
        expect(exists).toBe(true);
      });

      it('should return false for non-existent deck', async () => {
        const nonExistentId: DeckId = { value: 'non-existent-deck' };
        const exists = await repository.exists(nonExistentId);
        expect(exists).toBe(false);
      });
    });

    describe('isOwnedByUser', () => {
      it('should return true when user owns the deck', async () => {
        const deck = await repository.create({
          userId: userId1,
          name: 'User 1 Deck',
        });

        const isOwned = await repository.isOwnedByUser(deck.id, userId1);
        expect(isOwned).toBe(true);
      });

      it('should return false when user does not own the deck', async () => {
        const deck = await repository.create({
          userId: userId1,
          name: 'User 1 Deck',
        });

        const isOwned = await repository.isOwnedByUser(deck.id, userId2);
        expect(isOwned).toBe(false);
      });

      it('should return false for non-existent deck', async () => {
        const nonExistentId: DeckId = { value: 'non-existent-deck' };
        const isOwned = await repository.isOwnedByUser(nonExistentId, userId1);
        expect(isOwned).toBe(false);
      });
    });

    describe('clone', () => {
      it('should clone a public deck for another user', async () => {
        const originalDeck = await repository.create({
          userId: userId1,
          name: 'Original Public Deck',
          description: 'Original description',
          tags: ['original', 'public'],
          isPublic: true,
        });

        const clonedDeck = await repository.clone(originalDeck.id, userId2);

        expect(clonedDeck.id).not.toEqual(originalDeck.id);
        expect(clonedDeck.userId).toEqual(userId2);
        expect(clonedDeck.name).toBe('Original Public Deck');
        expect(clonedDeck.description).toBe('Original description');
        expect(clonedDeck.tags).toEqual(['original', 'public']);
        expect(clonedDeck.isPublic).toBe(false); // Cloned deck should be private
      });

      it('should throw error when cloning non-public deck', async () => {
        const privateDeck = await repository.create({
          userId: userId1,
          name: 'Private Deck',
          isPublic: false,
        });

        await expect(
          repository.clone(privateDeck.id, userId2),
        ).rejects.toThrow();
      });

      it('should throw error when cloning non-existent deck', async () => {
        const nonExistentId: DeckId = { value: 'non-existent-deck' };
        await expect(
          repository.clone(nonExistentId, userId2),
        ).rejects.toThrow();
      });
    });
  });
}
