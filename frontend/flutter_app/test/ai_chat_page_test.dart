import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_movie_booking_app/features/ai/ai_chat_page.dart';
import 'package:smart_movie_booking_app/features/movies/models.dart';
import 'package:smart_movie_booking_app/features/movies/movie_booking_api.dart';

void main() {
  testWidgets('AI chat screen renders', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AiChatPage(userId: 'u1', api: _FakeAiApi()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('AI Assistant'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
    expect(find.text('Ask me things like:'), findsOneWidget);
  });

  testWidgets('user message appears after sending', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AiChatPage(
          userId: 'u1',
          api: _FakeAiApi(sendResponse: 'Here are some picks.'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'Recommend some movies for me.');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pumpAndSettle();

    expect(find.text('Recommend some movies for me.'), findsOneWidget);
  });

  testWidgets('loading state appears while waiting for a response', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AiChatPage(
          userId: 'u1',
          api: _FakeAiApi(
            sendResponse: 'Here are some picks.',
            sendDelay: const Duration(milliseconds: 300),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'Recommend something.');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pump(); // one frame — the send call is now in flight

    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.pumpAndSettle();
  });

  testWidgets('successful AI response appears', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AiChatPage(
          userId: 'u1',
          api: _FakeAiApi(sendResponse: 'Try Midnight Warrior tonight.'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'Recommend something.');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pumpAndSettle();

    expect(find.text('Try Midnight Warrior tonight.'), findsOneWidget);
  });

  testWidgets('API error displays a friendly message, not raw details', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AiChatPage(
          userId: 'u1',
          api: _FakeAiApi(
            sendError: const MovieBookingApiException('AI agent service is unavailable'),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'Recommend something.');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pumpAndSettle();

    expect(find.text('AI agent service is unavailable'), findsOneWidget);
    expect(find.textContaining('Exception'), findsNothing);
    expect(find.textContaining('at Object'), findsNothing);
  });

  testWidgets('empty input cannot be submitted', (tester) async {
    var sendCalls = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: AiChatPage(
          userId: 'u1',
          api: _FakeAiApi(
            sendResponse: 'Should not be reached.',
            onSend: () => sendCalls++,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.send));
    await tester.pumpAndSettle();

    expect(sendCalls, 0);
    expect(find.text('Should not be reached.'), findsNothing);
    // The empty-history placeholder should still be showing.
    expect(find.text('Ask me things like:'), findsOneWidget);
  });

  testWidgets('multiple messages render correctly, in order', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AiChatPage(
          userId: 'u1',
          api: _FakeAiApi(sendResponse: 'Response text.'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'First question');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'Second question');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pumpAndSettle();

    expect(find.text('First question'), findsOneWidget);
    expect(find.text('Second question'), findsOneWidget);
    expect(find.text('Response text.'), findsNWidgets(2));
  });

  testWidgets('displays existing chat history on open', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AiChatPage(
          userId: 'u1',
          api: _FakeAiApi(
            history: [
              AiChatMessage(
                id: 'm1',
                userId: 'u1',
                prompt: 'What movies are available in Kolkata?',
                response: 'Here is what is playing in Kolkata.',
                createdAt: DateTime(2026, 1, 1, 10),
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('What movies are available in Kolkata?'), findsOneWidget);
    expect(find.text('Here is what is playing in Kolkata.'), findsOneWidget);
  });
}

class _FakeAiApi extends MovieBookingApi {
  _FakeAiApi({
    this.history = const [],
    this.sendResponse,
    this.sendError,
    this.sendDelay,
    this.onSend,
  });

  final List<AiChatMessage> history;
  final String? sendResponse;
  final Object? sendError;
  final Duration? sendDelay;
  final void Function()? onSend;

  @override
  Future<List<AiChatMessage>> getAiChatHistory() async => history;

  @override
  Future<AiChatMessage> sendAiChatMessage(String prompt) async {
    onSend?.call();
    if (sendDelay != null) {
      await Future.delayed(sendDelay!);
    }
    if (sendError != null) {
      throw sendError!;
    }
    return AiChatMessage(
      id: 'generated',
      userId: 'u1',
      prompt: prompt,
      response: sendResponse ?? 'AI response',
      createdAt: DateTime(2026, 1, 1),
    );
  }
}
