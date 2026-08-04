import 'package:flutter/material.dart';

import '../core/navigation/app_navigator.dart';
import '../features/auth/login_page.dart';
import '../features/auth/register_page.dart';
import '../features/movies/movie_list_page.dart';
import '../shared/theme/app_theme.dart';
import 'app_routes.dart';

class SmartMovieBookingApp extends StatelessWidget {
  const SmartMovieBookingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: AppNavigator.key,
      title: 'Smart Movie Booking',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      initialRoute: AppRoutes.login,
      routes: {
        AppRoutes.login: (_) => const LoginPage(),
        AppRoutes.register: (_) => const RegisterPage(),
        AppRoutes.home: (context) {
          final arguments = ModalRoute.of(context)?.settings.arguments;
          if (arguments is Map<String, dynamic>) {
            return MovieListPage(
              userId: arguments['id'] as String? ?? '',
              email: arguments['email'] as String? ?? '',
              profileLocation: arguments['location'] as String? ?? '',
              moviePreference: _readStringList(arguments['moviePreference']),
            );
          }
          final email = arguments as String?;
          return MovieListPage(email: email ?? '');
        },
      },
    );
  }

  static List<String> _readStringList(Object? value) {
    if (value is! List) return const [];
    return value.map((item) => item.toString()).toList();
  }
}
