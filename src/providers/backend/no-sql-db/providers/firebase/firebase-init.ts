import * as admin from 'firebase-admin';

export type InitFirebaseAdminArgs = {
  apiKey: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
};

const initializedApps: Map<string, admin.app.App> = new Map();

export function getFirebaseAdminApp(
  args: InitFirebaseAdminArgs,
): admin.app.App {
  if (initializedApps.has(args.projectId)) {
    return initializedApps.get(args.projectId) as admin.app.App;
  }

  const app = admin.initializeApp(
    {
      credential: admin.credential.cert({
        projectId: 'spaced-repetition-62f13',
        clientEmail:
          'firebase-adminsdk-fbsvc@spaced-repetition-62f13.iam.gserviceaccount.com',
        privateKey:
          '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCavifglxR5cwgl\n+hm6mBqJ83jsdhjbGlRp0QyFKpEAGhdrgLgc4TkUVsMI5RjIHhh2DevDo+rl51Nz\nmpgV4PbkvyNhJBr91bzPthg2UmWQOlexwzujApMpUCgCkxVapSP02hzxkTml3Paj\n2pchjv4CTQnhNwHQ2NFsdwxylEJGZr77G334kzzU81tQIgom6731C/EseAnzdINT\nAAPYeY800Le9qJ5emtlCKpgHQ0tSmAIk0UuO4fzWw+VLQta2rtHbZbfX0a+VB2Jl\nXZHTg9lOeWKzr2SKzM96KkOR/1QYpEIcpFcLs2kqKWfDPpHLLA/eVljTWYKoKtA1\n9q+fMSb9AgMBAAECggEABbRpyRvGF2B1sLFldkL/bs4GdiXiw93Bi8F3S3KBXtEC\nGNu+4zZXZx1NZTwi8NURNEr47Iu+usPk3Z/EUxbUgKQznvQYjaVDUnSwCaf50rp1\nO1pgo2Fn1k+m8J9bsRg3o4zQoS7oLT9LQB5XJizSHE4a8DivAl7NQQkrhjmFLvix\n2z+PlIszyV/P+TOfuPam3WWLL6iBIZq5YiYfZCHRIevA3WV3xYNKdfPAUMwQ84jh\nC6vUO+mHHu2avFfOOkICq4heZvpObdUGbk+ac+G3tSwfWXK967iNONsiQz/MMips\n6Y/AB6tPllSBDldbTZaG24gDAc17D8JRdo5ltgheyQKBgQDT+VHp4sI0uI5tM9o1\nk9YN6swMPr8ZpagpHGaLSRzUNhFy6kVrhbMdYA/7TYyf0oyAwEYMASvu9Y6Gm55l\nVVN2xWKGfwLyZo8c9pjJtfvXaVLtsgWqLBRND68d/7hQJwawRjKMXvlo4xaO6VV8\nJIrazc5fduqklwM1HSJWt9Zn2QKBgQC64dmqrZ9Wndzc1orAADl5m8gnjc17M5Sa\nVJosTlp8dJwGkbZNxWlSV6PuGpRJg9MKKye9EaS+la6DjkU+AthHB3T8/Dt8oWS4\niV52JE/nGYmKthau1WCdmoVpd3bH+euUrqY/iSadYPGfxAxsaKL6n5PdFx7/133i\nS6RCQQwFxQKBgEDWTBXsRFb39Ki2aZJly92p6gv8zVs87njUtRD5phXLC/9IZT+E\nP8tGbN0DVXY1YsCnD0Xwvc1z0sqdow9/z+3OZlqZUv9uG2xSiV15irTTBIisIUtx\n/CuuFnRoman6pfMZJbEGA+fvPiEsgfdc/hP7S5qrtw3tGxAN/0jjJnPRAoGBAIsk\n9gha1bSMPZJAO3bRs/mTv+eTcVc2BIMUUuaCQGVB/Zn2jCJDxjOFBY2XRKmn+U4s\n652esWcl05YoK+4L+DSKnNRwiWo2UOQFg8u7JbMQFJSvFxx9yz4NeyAXztz+fCVs\nFGRiHdo4AC/QrN9a2V55yoJnYLFlJVmEsHyUKftxAoGATTwRmigYIYHOFz49cOJd\nuvfg0G/9R6OkXOXdr3x1/hjUwme6s3ir+0ijtE3b+oyngsCJ1Qh3iITcA4vvUrt3\naU0s/1KPgZyB5rXSFJ3r/hDhVj7VsfRsWQ6TO8YHo9IldjwXqe6CytH8Z+N2AJZv\nXptxK+zFvj3HWn/e6xcwLE4=\n-----END PRIVATE KEY-----\n',
      }),
    },
    'spaced-repetition-62f13',
  );
  app.firestore().settings({
    ignoreUndefinedProperties: true,
  });

  initializedApps.set(args.projectId, app);
  return app;
}
