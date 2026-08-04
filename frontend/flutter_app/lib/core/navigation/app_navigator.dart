import 'package:flutter/material.dart';

import '../../app/app_routes.dart';
import '../storage/auth_storage.dart';

/// Lets the API layer (which has no BuildContext) force a return to the
/// login screen when the backend reports the stored token is no longer
/// valid (401) — e.g. after the 24h expiry. No refresh-token flow for this
/// phase: an expired/rejected token just signs the user out.
class AppNavigator {
  AppNavigator._();

  static final GlobalKey<NavigatorState> key = GlobalKey<NavigatorState>();

  static Future<void> forceLogout() async {
    await AuthStorage.clearToken();
    key.currentState?.pushNamedAndRemoveUntil(AppRoutes.login, (route) => false);
  }
}
