import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_movie_booking_app/features/movies/models.dart';
import 'package:smart_movie_booking_app/features/movies/movie_booking_api.dart';
import 'package:smart_movie_booking_app/features/social/who_is_coming_page.dart';

final _testMovie = Movie(
  id: 'm1',
  title: 'Test Movie',
  genre: 'Action',
  language: 'English',
  durationMinutes: 120,
  releaseDate: '2026-01-01',
);

final _testShow = Show(
  id: 's1',
  movieId: 'm1',
  screenId: 'sc1',
  startTime: DateTime(2026, 1, 1, 18),
  price: 200,
);

Widget _buildPage({List<String> moviePreference = const []}) {
  return MaterialApp(
    home: WhoIsComingPage(
      movie: _testMovie,
      show: _testShow,
      theatreName: 'Test Theatre',
      screenName: 'Screen 1',
      userId: 'me',
      email: 'user@test.com',
      moviePreference: moviePreference,
      api: _FakeMovieBookingApi(),
    ),
  );
}

void main() {
  testWidgets('shows suggested people on load', (tester) async {
    await tester.pumpWidget(_buildPage());
    await tester.pumpAndSettle();

    expect(find.text("Who's coming? \u{1F39F}\u{FE0F}"), findsOneWidget);
    expect(find.text('Priya Nair'), findsOneWidget);
    expect(find.text('Loves Thriller'), findsOneWidget);
    expect(find.text('Selected (0)'), findsOneWidget);
    expect(find.text('Continue with group of 0'), findsOneWidget);
  });

  testWidgets('the continue button stays visible without scrolling',
      (tester) async {
    await tester.pumpWidget(_buildPage());
    await tester.pumpAndSettle();

    // The button lives outside the scrollable list (a sticky bottom bar),
    // so it must be on screen immediately, before any scrolling.
    expect(
      tester.getRect(find.text('Continue with group of 0')).bottom,
      lessThanOrEqualTo(tester.view.physicalSize.height / tester.view.devicePixelRatio),
    );
  });

  testWidgets('selecting a person updates the selected count and button',
      (tester) async {
    await tester.pumpWidget(_buildPage());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Priya Nair'));
    await tester.pumpAndSettle();

    expect(find.text('Selected (1)'), findsOneWidget);
    expect(find.text('Continue with group of 1'), findsOneWidget);
  });

  testWidgets('extra guests count folds into the continue button total',
      (tester) async {
    await tester.pumpWidget(_buildPage());
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(1), '2');
    await tester.pumpAndSettle();

    expect(find.text('Continue with group of 2'), findsOneWidget);
  });

  testWidgets('has a hamburger drawer with profile settings and logout',
      (tester) async {
    await tester.pumpWidget(_buildPage());
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();

    expect(find.text('Profile settings'), findsOneWidget);
    expect(find.text('Logout'), findsOneWidget);
  });

  testWidgets('shows a back button that returns to the previous page when pushed',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: ElevatedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => WhoIsComingPage(
                    movie: _testMovie,
                    show: _testShow,
                    theatreName: 'Test Theatre',
                    screenName: 'Screen 1',
                    userId: 'me',
                    email: 'user@test.com',
                    api: _FakeMovieBookingApi(),
                  ),
                ),
              ),
              child: const Text('Open'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    expect(find.byType(BackButton), findsOneWidget);
    // Only one drawer/back affordance on each side — no duplicate hamburger.
    expect(find.byIcon(Icons.menu), findsOneWidget);

    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();

    expect(find.text('Open'), findsOneWidget);
    expect(find.text("Who's coming? \u{1F39F}\u{FE0F}"), findsNothing);
  });

  testWidgets('continue pushes seat selection for the chosen showtime',
      (tester) async {
    await tester.pumpWidget(_buildPage(moviePreference: const ['Action']));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Continue with group of 0'));
    await tester.pumpAndSettle();

    expect(find.text('Test Movie'), findsOneWidget);
    expect(find.text('Test Theatre - Screen 1'), findsOneWidget);
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

  @override
  Future<SeatMap> getShowSeatMap(String showId) async {
    return SeatMap(
      showId: showId,
      rows: 1,
      seatsPerRow: 1,
      price: 100,
      seatLabels: const ['A1'],
      bookedSeats: const {},
    );
  }
}
