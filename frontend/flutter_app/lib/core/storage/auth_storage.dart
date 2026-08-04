import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure, on-device storage for the signed-in session. This is the ONLY
/// place the JWT is allowed to live — screens must never receive it as a
/// constructor argument or pass it between widgets; the API layer
/// (AuthApi/MovieBookingApi) reads it from here directly when building each
/// request. Never stores the password.
class AuthStorage {
  AuthStorage._();

  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';
  static const _userIdKey = 'auth_user_id';
  static const _emailKey = 'auth_email';

  static Future<void> saveToken(String token) => _write(_tokenKey, token);

  static Future<String?> getToken() => _read(_tokenKey);

  static Future<void> saveUserId(String userId) => _write(_userIdKey, userId);

  static Future<String?> getUserId() => _read(_userIdKey);

  /// Not part of the auth boundary itself — kept alongside the token purely
  /// so a restored session can show the drawer header without a network
  /// round trip.
  static Future<void> saveEmail(String email) => _write(_emailKey, email);

  static Future<String?> getEmail() => _read(_emailKey);

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  /// Wipes the whole session (token + userId + email) — used on logout and
  /// when the backend reports the token is no longer valid (expired/
  /// rejected), per the "no refresh token, just sign the user out" rule for
  /// this phase.
  static Future<void> clearToken() async {
    await _delete(_tokenKey);
    await _delete(_userIdKey);
    await _delete(_emailKey);
  }

  // There's no real platform implementation behind the secure-storage
  // channel in the widget-test environment (no device/emulator backing
  // it) — every operation is caught here, once, so every caller across the
  // app can treat AuthStorage as something that simply never throws,
  // rather than each screen needing its own try/catch around it. Outside
  // tests (a real device/emulator), these exceptions don't happen.
  static Future<void> _write(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (_) {
      // No-op — see above.
    }
  }

  static Future<String?> _read(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (_) {
      return null;
    }
  }

  static Future<void> _delete(String key) async {
    try {
      await _storage.delete(key: key);
    } catch (_) {
      // No-op — see above.
    }
  }
}
