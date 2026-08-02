import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_movie_booking_app/features/profile/profile_settings_page.dart';

void main() {
  testWidgets('prefills location and movie preference fields', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: ProfileSettingsPage(
          userId: 'u1',
          email: 'user@test.com',
          location: 'Bengaluru',
          moviePreference: ['Action', 'Comedy'],
        ),
      ),
    );

    expect(find.text('Bengaluru'), findsOneWidget);
    expect(find.text('Action, Comedy'), findsOneWidget);
  });

  testWidgets('validates empty fields', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: ProfileSettingsPage(
          userId: 'u1',
          email: 'user@test.com',
          location: 'Bengaluru',
          moviePreference: ['Action'],
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField).at(0), '');
    await tester.enterText(find.byType(TextFormField).at(1), '');
    await tester.tap(find.text('Save changes'));
    await tester.pump();

    expect(find.text('Enter your location'), findsOneWidget);
    expect(find.text('Enter at least one movie preference'), findsOneWidget);
  });

  testWidgets('saves changes and pops with the updated values', (tester) async {
    Map<String, Object>? capturedArgs;
    Map<String, dynamic>? poppedResult;

    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: ElevatedButton(
              onPressed: () async {
                poppedResult = await Navigator.push<Map<String, dynamic>>(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ProfileSettingsPage(
                      userId: 'u1',
                      email: 'user@test.com',
                      location: 'Bengaluru',
                      moviePreference: const ['Action'],
                      updateProfile: ({
                        required userId,
                        required location,
                        required moviePreference,
                      }) async {
                        capturedArgs = {
                          'userId': userId,
                          'location': location,
                          'moviePreference': moviePreference,
                        };
                        return <String, dynamic>{};
                      },
                    ),
                  ),
                );
              },
              child: const Text('Open'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField).at(0), 'Mumbai');
    await tester.enterText(find.byType(TextFormField).at(1), 'Drama, Thriller');
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();

    expect(capturedArgs, {
      'userId': 'u1',
      'location': 'Mumbai',
      'moviePreference': ['Drama', 'Thriller'],
    });
    expect(poppedResult, {
      'location': 'Mumbai',
      'moviePreference': ['Drama', 'Thriller'],
    });
  });
}
