import 'dart:convert';
import 'dart:io';

class MovieBookingApi {
  MovieBookingApi({
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

    return 'https://smart-movie-booking-app.onrender.com';
  }

  Future<Map<String, dynamic>> get(String path) async {
    final request = await _httpClient.getUrl(Uri.parse('$_baseUrl$path'));
    return _send(request);
  }

  Future<Map<String, dynamic>> post(
    String path,
    Map<String, Object?> payload,
  ) async {
    final request = await _httpClient.postUrl(Uri.parse('$_baseUrl$path'));
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode(payload));
    return _send(request);
  }

  Future<Map<String, dynamic>> _send(HttpClientRequest request) async {
    final response = await request.close();
    final body = await response.transform(utf8.decoder).join();

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw MovieBookingApiException(_readErrorMessage(body));
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

  Future<Map<String, List<Map<String, dynamic>>>> loadWorkspace({
    required String userId,
  }) async {
    final responses = await Future.wait([
      get('/api/movies'),
      get('/api/theatres'),
      get('/api/shows/screens'),
      get('/api/shows'),
      get('/api/payments'),
      get('/api/bookings'),
      get('/api/catalog/genres'),
      get('/api/catalog/languages'),
      get('/api/catalog/actors'),
      if (userId.isNotEmpty) get('/api/users/$userId/preferences'),
      if (userId.isNotEmpty) get('/api/users/$userId/watch-history'),
    ]);

    return {
      'movies': _list(responses[0]['movies']),
      'theatres': _list(responses[1]['theatres']),
      'screens': _list(responses[2]['screens']),
      'shows': _list(responses[3]['shows']),
      'payments': _list(responses[4]['payments']),
      'bookings': _list(responses[5]['bookings']),
      'genres': _list(responses[6]['genres']),
      'languages': _list(responses[7]['languages']),
      'actors': _list(responses[8]['actors']),
      'preferences': userId.isEmpty ? [] : _list(responses[9]['preferences']),
      'watchHistory': userId.isEmpty ? [] : _list(responses[10]['watchHistory']),
    };
  }

  static List<Map<String, dynamic>> _list(Object? value) {
    if (value is List) {
      return value
          .whereType<Map>()
          .map((item) => item.cast<String, dynamic>())
          .toList();
    }

    return [];
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

class MovieBookingApiException implements Exception {
  const MovieBookingApiException(this.message);

  final String message;
}
