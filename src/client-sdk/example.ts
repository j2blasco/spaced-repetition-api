// Example usage of the SpacedRepetitionClient

import SpacedRepetitionClient from './index';

async function exampleUsage() {
  // Initialize the client
  const client = new SpacedRepetitionClient({
    baseUrl: 'http://localhost:4001',
    timeout: 5000,
  });

  try {
    // 1. Create a user
    console.log('Creating user...');
    const user = await client.createUser({
      preferences: {
        maxNewCardsPerDay: 20,
        maxReviewsPerDay: 100,
        timezone: 'UTC',
        defaultAlgorithm: 'sm2',
      },
    });
    console.log('User created:', user.id);

    // 2. Create some cards
    console.log('Creating cards...');
    const cards = await Promise.all([
      client.createCard({
        userId: user.id,
        tags: ['spanish', 'greetings'],
        data: { front: 'Hello', back: 'Hola' },
        algorithmType: 'sm2',
      }),
      client.createCard({
        userId: user.id,
        tags: ['spanish', 'greetings'],
        data: { front: 'Goodbye', back: 'Adiós' },
        algorithmType: 'sm2',
      }),
      client.createCard({
        userId: user.id,
        tags: ['spanish', 'courtesy'],
        data: { front: 'Thank you', back: 'Gracias' },
        algorithmType: 'sm2',
      }),
    ]);
    console.log(`Created ${cards.length} cards`);

    // 3. Get study statistics
    console.log('Getting study stats...');
    const stats = await client.getStudyStats(user.id);
    console.log('Study stats:', stats);

    // 4. Get due cards for study session
    console.log('Starting study session...');
    const studySession = await client.createStudySession(user.id, {
      tags: ['spanish'],
      limit: 10,
      currentDate: new Date(),
    });
    console.log(`Study session: ${studySession.dueCards.length} cards due`);

    // 5. Simulate reviewing cards
    if (studySession.dueCards.length > 0) {
      console.log('Reviewing cards...');
      const reviewResults = await client.batchReviewCards([
        {
          cardId: studySession.dueCards[0].id,
          response: 'good',
          reviewedAt: new Date(),
        },
        // Add more reviews as needed
      ]);
      console.log(`Reviewed ${reviewResults.length} cards`);

      // Show the updated scheduling for the first card
      if (reviewResults[0]) {
        console.log(
          'Next review date:',
          reviewResults[0].newScheduling.nextReviewDate,
        );
      }
    }

    // 6. Get updated stats after review
    const updatedStats = await client.getStudyStats(user.id);
    console.log('Updated study stats:', updatedStats);

    // 7. Health check
    const health = await client.healthCheck();
    console.log('Server health:', health);
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

// Export for use in other files
export { exampleUsage };

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}
