import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_movie_booking_app/app/app_routes.dart';
import 'package:smart_movie_booking_app/app/smart_movie_booking_app.dart';
import 'package:smart_movie_booking_app/core/storage/auth_storage.dart';
import 'package:smart_movie_booking_app/features/auth/auth_api.dart';
import 'package:smart_movie_booking_app/features/auth/change_password_page.dart';
import 'package:smart_movie_booking_app/features/auth/login_page.dart';
import 'package:smart_movie_booking_app/features/auth/register_page.dart';
import 'package:smart_movie_booking_app/features/movies/models.dart';
import 'package:smart_movie_booking_app/features/movies/movie_booking_api.dart';
import 'package:smart_movie_booking_app/features/movies/movie_list_page.dart';

void main() {
  // flutter_secure_storage's Windows backend persists to real, on-disk OS
  // storage rather than a mockable platform channel — so LoginPage's
  // session-restore check (AuthStorage.isLoggedIn()) can otherwise pick up
  // a real leftover credential from outside this test run entirely. Every
  // test in this file must start from a guaranteed-empty session.
  setUp(() async {
    await AuthStorage.clearToken();
  });

  testWidgets('shows login page first', (tester) async {
    await tester.pumpWidget(const SmartMovieBookingApp());

    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Email ID'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
    expect(find.text('Create new account'), findsOneWidget);
  });

  testWidgets('validates empty login form', (tester) async {
    await tester.pumpWidget(const SmartMovieBookingApp());

    await tester.tap(find.text('Login'));
    await tester.pump();

    expect(find.text('Enter your email ID'), findsOneWidget);
    expect(find.text('Enter your password'), findsOneWidget);
  });

  testWidgets('submits valid login form and opens home page', (tester) async {
    String? loginEmail;
    String? loginPassword;
    await tester.pumpWidget(
      MaterialApp(
        routes: {
          AppRoutes.home: (context) {
            final arguments = ModalRoute.of(context)?.settings.arguments;
            final email = arguments is Map<String, dynamic>
                ? arguments['email'] as String?
                : arguments as String?;
            return Scaffold(body: Text('Home for $email'));
          },
        },
        home: LoginPage(
          loginUser: ({required email, required password}) async {
            loginEmail = email;
            loginPassword = password;
          },
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField).at(0), 'user@test.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'password123');
    await tester.tap(find.text('Login'));
    await tester.pumpAndSettle();

    expect(loginEmail, 'user@test.com');
    expect(loginPassword, 'password123');
    expect(find.text('Home for user@test.com'), findsOneWidget);
  });

  testWidgets('shows an error when login fails', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: LoginPage(
          loginUser: ({required email, required password}) async {
            throw const AuthApiException('Email ID or password is incorrect');
          },
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField).at(0), 'missing@test.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'password123');
    await tester.tap(find.text('Login'));
    await tester.pump();

    expect(find.text('Email ID or password is incorrect'), findsOneWidget);
  });

  testWidgets('logs out from hamburger menu', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        routes: {
          '/': (_) => LoginPage(
                loginUser: ({required email, required password}) async {},
              ),
          AppRoutes.home: (context) {
            final arguments = ModalRoute.of(context)?.settings.arguments;
            final email = arguments is Map<String, dynamic>
                ? arguments['email'] as String?
                : arguments as String?;
            return MovieListPage(email: email ?? '', api: TestMovieBookingApi());
          },
        },
      ),
    );

    await tester.enterText(find.byType(TextFormField).at(0), 'user@test.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'password123');
    await tester.tap(find.text('Login'));
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Logout'));
    await tester.pumpAndSettle();

    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Create new account'), findsOneWidget);
  });

  testWidgets('opens profile settings from hamburger menu', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: MovieListPage(email: 'user@test.com', api: TestMovieBookingApi()),
      ),
    );

    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Profile settings'));
    await tester.pumpAndSettle();

    expect(find.text('Location'), findsOneWidget);
    expect(find.text('Movie preference'), findsOneWidget);
  });

  testWidgets('opens change password from profile settings', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: MovieListPage(email: 'user@test.com', api: TestMovieBookingApi()),
      ),
    );

    await tester.tap(find.byIcon(Icons.menu));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Profile settings'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Change password'));
    await tester.pumpAndSettle();

    expect(find.text('Current password'), findsOneWidget);
  });

  testWidgets('navigates from login to registration page', (tester) async {
    await tester.pumpWidget(const SmartMovieBookingApp());

    await tester.tap(find.text('Create new account'));
    await tester.pumpAndSettle();

    expect(find.text('Create account'), findsOneWidget);
    expect(find.text('Full name'), findsOneWidget);
    expect(find.text('Gender'), findsOneWidget);
    expect(find.text('Location'), findsOneWidget);
    expect(find.text('Movie preference'), findsOneWidget);
    expect(find.text('Phone number'), findsOneWidget);
  });

  testWidgets('validates empty registration form', (tester) async {
    await tester.pumpWidget(const SmartMovieBookingApp());

    await tester.tap(find.text('Create new account'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Register'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Register'));
    await tester.pump();

    expect(find.text('Enter your full name'), findsOneWidget);
    expect(find.text('Enter your location'), findsOneWidget);
    expect(find.text('Enter at least one movie preference'), findsOneWidget);
    expect(find.text('Enter your email ID'), findsOneWidget);
    expect(find.text('Enter your phone number'), findsOneWidget);
    expect(find.text('Password must be at least 6 characters'), findsOneWidget);
  });

  testWidgets('submits valid registration form', (tester) async {
    Map<String, Object>? submittedPayload;
    await tester.pumpWidget(
      MaterialApp(
        home: RegisterPage(
          registerUser: (payload) async {
            submittedPayload = payload;
          },
        ),
      ),
    );

    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'Varsha Nath');
    await tester.enterText(fields.at(1), 'Bengaluru');
    await tester.enterText(fields.at(2), 'Action, comedy');
    await tester.enterText(fields.at(3), 'varsha@test.com');
    await tester.enterText(fields.at(4), '9876543210');
    await tester.enterText(fields.at(5), 'password123');
    await tester.ensureVisible(find.text('Register'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Register'));
    await tester.pumpAndSettle();

    expect(submittedPayload, {
      'name': 'Varsha Nath',
      'gender': 'prefer_not_to_say',
      'location': 'Bengaluru',
      'moviePreference': ['Action', 'comedy'],
      'email': 'varsha@test.com',
      'phoneNumber': '9876543210',
      'password': 'password123',
    });
  });

  testWidgets('submits password change form', (tester) async {
    Map<String, String>? submittedPayload;
    await tester.pumpWidget(
      MaterialApp(
        routes: {
          '/home': (_) => const Scaffold(body: Text('Home')),
        },
        home: ChangePasswordPage(
          email: 'user@test.com',
          changePassword: ({
            required email,
            required currentPassword,
            required newPassword,
          }) async {
            submittedPayload = {
              'email': email,
              'currentPassword': currentPassword,
              'newPassword': newPassword,
            };
          },
        ),
      ),
    );

    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'password123');
    await tester.enterText(fields.at(1), 'newpass123');
    await tester.tap(find.text('Save password'));
    await tester.pumpAndSettle();

    expect(submittedPayload, {
      'email': 'user@test.com',
      'currentPassword': 'password123',
      'newPassword': 'newpass123',
    });
  });

  testWidgets('returns from registration page to login page', (tester) async {
    await tester.pumpWidget(const SmartMovieBookingApp());

    await tester.tap(find.text('Create new account'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Back to login'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Back to login'));
    await tester.pumpAndSettle();

    expect(find.text('Welcome back'), findsOneWidget);
  });
}

class TestMovieBookingApi extends MovieBookingApi {
  @override
  Future<List<Movie>> getMovies({String? locationId}) async => [];

  @override
  Future<List<MovieLocation>> getLocations() async => [];

  @override
  Future<List<Theatre>> getTheatres() async => [];

  @override
  Future<List<Screen>> getScreens() async => [];

  @override
  Future<List<Show>> getShows() async => [];

  @override
  Future<List<BookingRecord>> getBookings() async => [];

  @override
  Future<List<PaymentRecord>> getPayments() async => [];
}
