import 'dart:async';
import 'dart:convert';
import 'dart:io';

import '../../core/navigation/app_navigator.dart';
import '../../core/storage/auth_storage.dart';
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

  Future<List<Movie>> getMovies({String? locationId}) async {
    final query = (locationId == null || locationId.isEmpty)
        ? ''
        : '?locationId=${Uri.encodeQueryComponent(locationId)}';
    final response = await _get('/api/movies$query');
    return _list(response['movies']).map(Movie.fromJson).toList();
  }

  Future<List<MovieLocation>> getLocations() async {
    final response = await _get('/api/locations');
    return _list(response['locations']).map(MovieLocation.fromJson).toList();
  }

  Future<List<UserSummary>> searchUsers({
    String search = '',
    String? excludeUserId,
  }) async {
    final params = <String, String>{
      if (search.isNotEmpty) 'search': search,
      if (excludeUserId != null && excludeUserId.isNotEmpty)
        'excludeUserId': excludeUserId,
    };
    final query = Uri(queryParameters: params).query;
    final response = await _get(query.isEmpty ? '/api/users' : '/api/users?$query');
    return _list(response['users']).map(UserSummary.fromJson).toList();
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

  Future<List<Review>> getMovieReviews(String movieId) async {
    final response = await _get('/api/movies/$movieId/reviews');
    return _list(response['reviews']).map(Review.fromJson).toList();
  }

  Future<List<Review>> getUserReviews(String userId) async {
    final response = await _get('/api/users/$userId/reviews');
    return _list(response['reviews']).map(Review.fromJson).toList();
  }

  Future<Review> addMovieReview({
    required String movieId,
    required String userId,
    required double rating,
    required String reviewText,
  }) async {
    final response = await _post('/api/movies/$movieId/reviews', {
      'userId': userId,
      'rating': rating,
      'reviewText': reviewText,
    });
    return Review.fromJson(response['review'] as Map<String, dynamic>);
  }

  Future<List<WatchlistItem>> getWatchlist(String userId) async {
    final response = await _get('/api/users/$userId/watchlist');
    return _list(response['watchlist']).map(WatchlistItem.fromJson).toList();
  }

  Future<WatchlistItem> addToWatchlist({
    required String userId,
    required String movieId,
  }) async {
    final response = await _post('/api/users/$userId/watchlist', {'movieId': movieId});
    return WatchlistItem.fromJson(response['item'] as Map<String, dynamic>);
  }

  Future<void> removeFromWatchlist({
    required String userId,
    required String movieId,
  }) async {
    await _delete('/api/users/$userId/watchlist/$movieId');
  }

  Future<List<Recommendation>> getRecommendations(String userId) async {
    final response = await _get('/api/users/$userId/recommendations');
    return _list(response['recommendations']).map(Recommendation.fromJson).toList();
  }

  Future<List<AppNotification>> getNotifications(String userId) async {
    final response = await _get('/api/users/$userId/notifications');
    return _list(response['notifications']).map(AppNotification.fromJson).toList();
  }

  Future<AppNotification> markNotificationRead({
    required String userId,
    required String notificationId,
  }) async {
    final response = await _post('/api/users/$userId/notifications/$notificationId/read', {});
    return AppNotification.fromJson(response['notification'] as Map<String, dynamic>);
  }

  Future<List<SearchHistoryEntry>> getSearchHistory(String userId) async {
    final response = await _get('/api/users/$userId/search-history');
    return _list(response['searchHistory']).map(SearchHistoryEntry.fromJson).toList();
  }

  Future<SearchHistoryEntry> addSearchHistory({
    required String userId,
    required String query,
  }) async {
    final response = await _post('/api/users/$userId/search-history', {'query': query});
    return SearchHistoryEntry.fromJson(response['entry'] as Map<String, dynamic>);
  }

  // No userId parameter — the path segment must equal the authenticated
  // caller (the backend rejects a mismatch with 403 regardless), so the id
  // always comes from the signed-in session, never from a value the caller
  // typed or was asked to supply.
  Future<List<AiChatMessage>> getAiChatHistory() async {
    final userId = await _requireAuthenticatedUserId();
    final response = await _get('/api/users/$userId/ai-chat');
    return _list(response['messages']).map(AiChatMessage.fromJson).toList();
  }

  Future<AiChatMessage> sendAiChatMessage(String prompt) async {
    final userId = await _requireAuthenticatedUserId();
    final response = await _post('/api/users/$userId/ai-chat', {'prompt': prompt});
    return AiChatMessage.fromJson(response['message'] as Map<String, dynamic>);
  }

  Future<String> _requireAuthenticatedUserId() async {
    final userId = await AuthStorage.getUserId();
    if (userId == null || userId.isEmpty) {
      throw const MovieBookingApiException('You need to be logged in for this.');
    }
    return userId;
  }

  Future<List<Coupon>> getCoupons() async {
    final response = await _get('/api/coupons');
    return _list(response['coupons']).map(Coupon.fromJson).toList();
  }

  Future<Coupon> getCouponByCode(String code) async {
    final response = await _get('/api/coupons/$code');
    return Coupon.fromJson(response['coupon'] as Map<String, dynamic>);
  }

  Future<List<ScreenSeat>> getScreenSeats(String screenId) async {
    final response = await _get('/api/shows/screens/$screenId/seats');
    return _list(response['seats']).map(ScreenSeat.fromJson).toList();
  }

  Future<List<MovieBookingStat>> getMostBookedMovies() async {
    final response = await _get('/api/analytics/movies');
    return _list(response['movies']).map(MovieBookingStat.fromJson).toList();
  }

  Future<List<TheatreBookingStat>> getMostBookedTheatres() async {
    final response = await _get('/api/analytics/theatres');
    return _list(response['theatres']).map(TheatreBookingStat.fromJson).toList();
  }

  Future<List<GenrePopularityStat>> getPopularGenres() async {
    final response = await _get('/api/analytics/genres');
    return _list(response['genres']).map(GenrePopularityStat.fromJson).toList();
  }

  Future<List<DailyRevenueStat>> getDailyRevenue() async {
    final response = await _get('/api/analytics/revenue');
    return _list(response['revenue']).map(DailyRevenueStat.fromJson).toList();
  }

  Future<List<ShowOccupancyStat>> getShowOccupancy() async {
    final response = await _get('/api/analytics/occupancy');
    return _list(response['occupancy']).map(ShowOccupancyStat.fromJson).toList();
  }

  Future<Map<String, dynamic>> _get(String path) async {
    final request = await _httpClient.getUrl(Uri.parse('$_baseUrl$path'));
    await _attachAuthHeader(request);
    return _send(request);
  }

  Future<Map<String, dynamic>> _post(
    String path,
    Map<String, Object?> payload,
  ) async {
    final request = await _httpClient.postUrl(Uri.parse('$_baseUrl$path'));
    await _attachAuthHeader(request);
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode(payload));
    return _send(request);
  }

  Future<Map<String, dynamic>> _delete(String path) async {
    final request = await _httpClient.deleteUrl(Uri.parse('$_baseUrl$path'));
    await _attachAuthHeader(request);
    return _send(request);
  }

  // Single choke point for every request this client makes — this is what
  // lets every screen just call e.g. getWatchlist(userId) without knowing
  // anything about tokens; the JWT never has to be threaded through widget
  // constructors.
  Future<void> _attachAuthHeader(HttpClientRequest request) async {
    final token = await AuthStorage.getToken();
    if (token != null && token.isNotEmpty) {
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
    }
  }

  Future<Map<String, dynamic>> _send(HttpClientRequest request) async {
    final response = await request.close();
    final body = await response.transform(utf8.decoder).join();

    if (response.statusCode == 401) {
      // No refresh-token flow for this phase — a rejected/expired token
      // just signs the user out. Fire-and-forget so the exception below
      // still surfaces to whichever screen made this call.
      unawaited(AppNavigator.forceLogout());
    }

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
