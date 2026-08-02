import 'dart:convert';
import 'dart:io';

class AuthApi {
  AuthApi({
    String? baseUrl,
    HttpClient? httpClient,
  })  : _baseUrl = baseUrl ?? _resolveDefaultBaseUrl(),
        _httpClient = httpClient ?? HttpClient();

  static const _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  final String _baseUrl;
  final HttpClient _httpClient;

  static String _resolveDefaultBaseUrl() {
    if (_configuredBaseUrl.isNotEmpty) {
      return _configuredBaseUrl;
    }

    if (Platform.isAndroid) {
      return 'https://smart-movie-booking-app.onrender.com';
    }

    return 'https://smart-movie-booking-app.onrender.com';
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) {
    return _post('/api/users/login', {
      'email': email,
      'password': password,
    });
  }

  Future<Map<String, dynamic>> registerUser(Map<String, Object> payload) {
    return _post('/api/users/register', payload);
  }

  Future<Map<String, dynamic>> updateProfile({
    required String userId,
    required String location,
    required List<String> moviePreference,
  }) {
    return _post('/api/users/$userId/profile', {
      'location': location,
      'moviePreference': moviePreference,
    });
  }

  Future<Map<String, dynamic>> changePassword({
    required String email,
    required String currentPassword,
    required String newPassword,
  }) {
    return _post('/api/users/change-password', {
      'email': email,
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<Map<String, dynamic>> _post(
    String path,
    Map<String, Object> payload,
  ) async {
    final request = await _httpClient.postUrl(Uri.parse('$_baseUrl$path'));
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode(payload));

    final response = await request.close();
    final body = await response.transform(utf8.decoder).join();

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AuthApiException(_readErrorMessage(body));
    }

    if (body.isEmpty) {
      return <String, dynamic>{};
    }

    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }

    return <String, dynamic>{};
  }

  String _readErrorMessage(String body) {
    if (body.isEmpty) {
      return 'Request failed. Please try again.';
    }

    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        final message = decoded['message'];
        if (message is String && message.trim().isNotEmpty) {
          return message;
        }
      }
    } on FormatException {
      return 'Request failed. Please try again.';
    }

    return 'Request failed. Please try again.';
  }
}

class AuthApiException implements Exception {
  const AuthApiException(this.message);

  final String message;
}
