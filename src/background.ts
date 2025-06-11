// Twitter HP Monitor - Background Script

interface AnalysisRequest {
  action: string;
  text: string;
}

interface AnalysisResult {
  score: number;
  reason: string;
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface OpenAIErrorResponse {
  error?: {
    message?: string;
  };
}

class BackgroundService {
  constructor() {
    this.setupMessageListener();
  }

  setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((
      request: AnalysisRequest,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: any) => void
    ) => {
      if (request.action === 'analyzeTweet') {
        this.analyzeTweetWithOpenAI(request.text)
          .then(result => {
            sendResponse({ success: true, data: result });
          })
          .catch(error => {
            console.error('分析エラー:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // 非同期レスポンスを示す
      } else if (request.action === 'openPopup') {
        // 拡張機能のポップアップを開く
        chrome.action.openPopup().catch(error => {
          console.error('ポップアップ開けませんでした:', error);
        });
        return false;
      }
      return false;
    });
  }

  async getOpenAIKey(): Promise<string> {
    const result = await chrome.storage.local.get(['openaiApiKey']);
    if (!result.openaiApiKey) {
      throw new Error('OpenAI APIキーが設定されていません');
    }
    return result.openaiApiKey;
  }

  async analyzeTweetWithOpenAI(tweetText: string): Promise<AnalysisResult> {
    const apiKey = await this.getOpenAIKey();
    
    const prompt = `
あなたは情報リテラシーの専門家です。
以下のツイート内容の信頼性を0-5のスケールで評価してください。
ただし、ユーモア、ジョーク、とんち、明らかな創作・フィクション、個人の感想や体験談は低評価しないでください。

評価基準：
- 0: 健全な内容（日常会話、ユーモア、個人の感想、事実に基づく情報など）
- 1: 軽微な注意が必要（やや誇張された表現、確認が困難な個人体験など）
- 2: 慎重に判断すべき内容（根拠不明の主張、感情的な表現を含む）
- 3: 問題の可能性あり（明らかに根拠不足の断定的主張、扇動的な内容）
- 4: 明らかに問題がある（悪意のあるデマの可能性、害をもたらす可能性のある誤情報）
- 5: 深刻に有害（確実にデマ、詐欺、重大な害をもたらす情報）

重要：以下は低評価しない
- 明らかなジョークやユーモア
- とんちや言葉遊び
- フィクションや創作物
- 個人の感想や体験談
- エンターテイメント目的の創作
- 一般的な日常会話

ツイート内容: "${tweetText}"

以下のJSON形式で回答してください：
{
  "score": [0-5の数値],
  "reason": "[判定理由を1文で簡潔に]"
}
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData: OpenAIErrorResponse = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('APIからの応答が無効です');
      }

      // JSONレスポンスをパース
      try {
        const result = JSON.parse(content) as AnalysisResult;
        
        // 結果の検証
        if (typeof result.score !== 'number' || result.score < 0 || result.score > 5) {
          throw new Error('無効なスコア値');
        }

        if (typeof result.reason !== 'string' || result.reason.length === 0) {
          throw new Error('無効な理由');
        }

        return {
          score: Math.round(result.score), // 整数に丸める
          reason: result.reason
        };

      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw content:', content);
        
        // フォールバック: テキストから数値を抽出
        const scoreMatch = content.match(/score["\s]*:\s*(\d+)/i);
        const reasonMatch = content.match(/reason["\s]*:\s*["']([^"']+)["']/i);
        
        if (scoreMatch) {
          return {
            score: Math.min(5, Math.max(0, parseInt(scoreMatch[1]))),
            reason: reasonMatch ? reasonMatch[1] : '分析完了'
          };
        }
        
        throw new Error('レスポンスの解析に失敗しました');
      }

    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }
}

// バックグラウンドサービス初期化
new BackgroundService();