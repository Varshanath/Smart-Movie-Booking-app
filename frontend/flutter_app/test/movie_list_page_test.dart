import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_movie_booking_app/features/movies/models.dart';
import 'package:smart_movie_booking_app/features/movies/movie_booking_api.dart';
import 'package:smart_movie_booking_app/features/movies/movie_list_page.dart';

void main() {
  testWidgets('shows all movies when no "For You" filter is applied',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: MovieListPage(
          email: 'user@test.com',
          moviePreference: const ['Action'],
          api: _FakeMovieBookingApi(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Action Movie'), findsOneWidget);
    expect(find.text('Romance Movie'), findsOneWidget);
    expect(find.text('For You'), findsOneWidget);
  });

  testWidgets('narrows the grid to preferred genres when "For You" is on',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: MovieListPage(
          email: 'user@test.com',
          moviePreference: const ['action'],
          api: _FakeMovieBookingApi(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(FilterChip, 'For You'));
    await tester.pumpAndSettle();

    expect(find.text('Action Movie'), findsOneWidget);
    expect(find.text('Romance Movie'), findsNothing);
  });

  testWidgets('hides the "For You" chip when the user has no preferences',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: MovieListPage(
          email: 'user@test.com',
          api: _FakeMovieBookingApi(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('For You'), findsNothing);
  });
}

class _FakeMovieBookingApi extends MovieBookingApi {
  @override
  Future<List<Movie>> getMovies({String? locationId}) async => [
        Movie(
          id: 'm1',
          title: 'Action Movie',
          genre: 'Action',
          language: 'English',
          durationMinutes: 120,
          releaseDate: '2026-01-01',
        ),
        Movie(
          id: 'm2',
          title: 'Romance Movie',
          genre: 'Romance',
          language: 'English',
          durationMinutes: 100,
          releaseDate: '2026-01-01',
        ),
      ];

  @override
  Future<List<MovieLocation>> getLocations() async => [];

  @override
  Future<List<Theatre>> getTheatres() async => [];

  @override
  Future<List<Screen>> getScreens() async => [];

  @override
  Future<List<Show>> getShows() async => [];
}
