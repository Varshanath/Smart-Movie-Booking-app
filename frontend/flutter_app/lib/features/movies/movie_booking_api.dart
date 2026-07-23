import 'dart:convert';
import 'dart:io';

import 'models.dart';

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

  Future<List<Movie>> getMovies() async {
    final response = await _get('/api/movies');
    return _list(response['movies']).map(Movie.fromJson).toList();
  }

  Future<List<Theatre>> getTheatres() async {
    final response = await _get('/api/theatres');
    return _list(response['theatres']).map(Theatre.fromJson).toList();
  }

  Future<List<Screen>> getScreens() async {
    final response = await _get('/api/shows/screens');
    return _list(response['screens']).map(Screen.fromJson).toList();
  }

  Future<List<Show>> getShows() async {
    final response = await _get('/api/shows');
    return _list(response['shows']).map(Show.fromJson).toList();
  }

  Future<SeatMap> getShowSeatMap(String showId) async {
    final response = await _get('/api/shows/$showId/seats');
    return SeatMap.fromJson(response['seatMap'] as Map<String, dynamic>);
  }

  Future<PaymentRecord> createPayment({
    required int amount,
    String status = 'paid',
    String? providerReference,
  }) async {
    final response = await _post('/api/payments', {
      'amount': amount,
      'status': status,
      if (providerReference != null) 'providerReference': providerReference,
    });
    return PaymentRecord.fromJson(response['payment'] as Map<String, dynamic>);
  }

  Future<BookingRecord> createBooking({
    required String userId,
    required String showId,
    required String paymentId,
    required List<String> seatNumbers,
  }) async {
    final response = await _post('/api/bookings/movie', {
      'userId': userId,
      'showId': showId,
      'paymentId': paymentId,
      'seatNumbers': seatNumbers,
    });
    return BookingRecord.fromJson(response['booking'] as Map<String, dynamic>);
  }

  Future<List<BookingRecord>> getBookings() async {
    final response = await _get('/api/bookings');
    return _list(response['bookings']).map(BookingRecord.fromJson).toList();
  }

  Future<List<PaymentRecord>> getPayments() async {
    final response = await _get('/api/payments');
    return _list(response['payments']).map(PaymentRecord.fromJson).toList();
  }

  Future<Map<String, dynamic>> _get(String path) async {
    final request = await _httpClient.getUrl(Uri.parse('$_baseUrl$path'));
    return _send(request);
  }

  Future<Map<String, dynamic>> _post(
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
