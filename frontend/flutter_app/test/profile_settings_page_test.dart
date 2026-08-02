import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_movie_booking_app/app/app_routes.dart';
import 'package:smart_movie_booking_app/features/profile/profile_settings_page.dart';

void main() {
  testWidgets('prefills location and movie preference fields', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ProfileSettingsPage(
          userId: 'u1',
          email: 'user@test.com',
          location: 'Bengaluru',
          moviePreference: const ['Action', 'Comedy'],
        ),
      ),
    );

    expect(find.text('Bengaluru'), findsOneWidget);
    expect(find.text('Action, Comedy'), findsOneWidget);
  });

  testWidgets('validates empty fields', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ProfileSettingsPage(
          userId: 'u1',
          email: 'user@test.com',
          location: 'Bengaluru',
          moviePreference: const ['Action'],
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

  testWidgets('saves changes and lands on Now Showing', (tester) async {
    Map<String, Object>? capturedArgs;

    await tester.pumpWidget(
      MaterialApp(
        routes: {
          AppRoutes.home: (context) {
            final arguments =
                ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>;
            return Scaffold(body: Text('Home for ${arguments['email']}'));
          },
        },
        home: ProfileSettingsPage(
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

    await tester.enterText(find.byType(TextFormField).at(0), 'Mumbai');
    await tester.enterText(find.byType(TextFormField).at(1), 'Drama, Thriller');
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();

    expect(capturedArgs, {
      'userId': 'u1',
      'location': 'Mumbai',
      'moviePreference': ['Drama', 'Thriller'],
    });
    expect(find.text('Home for user@test.com'), findsOneWidget);
  });
}
