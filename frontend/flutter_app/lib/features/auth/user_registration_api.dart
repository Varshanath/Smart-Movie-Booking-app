import 'dart:convert';
import 'dart:io';

class UserRegistrationApi {
  UserRegistrationApi({
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
      return 'http://10.0.2.2:4000';
    }

    return 'http://localhost:4000';
  }

  Future<void> registerUser(Map<String, Object> payload) async {
    final url = Uri.parse('$_baseUrl/api/users/register');
    final request = await _httpClient.postUrl(url);
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode(payload));

    final response = await request.close();
    final body = await response.transform(utf8.decoder).join();

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw UserRegistrationException(_readErrorMessage(body));
    }
  }

  String _readErrorMessage(String body) {
    if (body.isEmpty) {
      return 'Registration failed. Please try again.';
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
      return 'Registration failed. Please try again.';
    }

    return 'Registration failed. Please try again.';
  }
}

class UserRegistrationException implements Exception {
  const UserRegistrationException(this.message);

  final String message;
}
