import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_movie_booking_app/app/app_routes.dart';
import 'package:smart_movie_booking_app/features/movies/models.dart';
import 'package:smart_movie_booking_app/features/movies/movie_booking_api.dart';
import 'package:smart_movie_booking_app/features/social/who_is_coming_page.dart';

void main() {
  testWidgets('shows suggested people on load', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: WhoIsComingPage(
          userId: 'me',
          email: 'user@test.com',
          api: _FakeMovieBookingApi(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text("Who's coming? \u{1F39F}\u{FE0F}"), findsOneWidget);
    expect(find.text('Priya Nair'), findsOneWidget);
    expect(find.text('Loves Thriller'), findsOneWidget);
    expect(find.text('Selected (0)'), findsOneWidget);
    expect(find.text('Continue with group of 0'), findsOneWidget);
  });

  testWidgets('selecting a person updates the selected count and button',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: WhoIsComingPage(
          userId: 'me',
          email: 'user@test.com',
          api: _FakeMovieBookingApi(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Priya Nair'));
    await tester.pumpAndSettle();

    expect(find.text('Selected (1)'), findsOneWidget);
    expect(find.text('Continue with group of 1'), findsOneWidget);
  });

  testWidgets('extra guests count folds into the continue button total',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: WhoIsComingPage(
          userId: 'me',
          email: 'user@test.com',
          api: _FakeMovieBookingApi(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(1), '2');
    await tester.pumpAndSettle();

    expect(find.text('Continue with group of 2'), findsOneWidget);
  });

  testWidgets('continue navigates to the home route with the user arguments',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        routes: {
          AppRoutes.home: (context) {
            final arguments =
                ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>;
            return Scaffold(body: Text('Home for ${arguments['email']}'));
          },
        },
        home: WhoIsComingPage(
          userId: 'me',
          email: 'user@test.com',
          moviePreference: const ['Action'],
          api: _FakeMovieBookingApi(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Continue with group of 0'));
    await tester.pumpAndSettle();

    expect(find.text('Home for user@test.com'), findsOneWidget);
  });
}

class _FakeMovieBookingApi extends MovieBookingApi {
  @override
  Future<List<UserSummary>> searchUsers({
    String search = '',
    String? excludeUserId,
  }) async {
    return [
      UserSummary(
        id: 'u1',
        name: 'Priya Nair',
        email: 'priya@test.com',
        moviePreference: const ['Thriller'],
      ),
      UserSummary(
        id: 'u2',
        name: 'Rahul Verma',
        email: 'rahul@test.com',
        moviePreference: const [],
      ),
    ];
  }
}
