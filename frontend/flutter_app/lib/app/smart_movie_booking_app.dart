import 'package:flutter/material.dart';

import '../features/auth/login_page.dart';
import '../features/auth/register_page.dart';
import '../features/auth/change_password_page.dart';
import '../features/home/home_page.dart';
import '../shared/theme/app_theme.dart';
import 'app_routes.dart';

class SmartMovieBookingApp extends StatelessWidget {
  const SmartMovieBookingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Movie Booking',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      initialRoute: AppRoutes.login,
      routes: {
        AppRoutes.login: (_) => const LoginPage(),
        AppRoutes.register: (_) => const RegisterPage(),
        AppRoutes.home: (context) {
          final email = ModalRoute.of(context)?.settings.arguments as String?;
          return HomePage(email: email ?? '');
        },
        AppRoutes.changePassword: (context) {
          final email = ModalRoute.of(context)?.settings.arguments as String?;
          return ChangePasswordPage(email: email ?? '');
        },
      },
    );
  }
}
