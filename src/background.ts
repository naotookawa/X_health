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
以下のツイート内容の信頼性を0-5のスケールで評価してください：
- 0: 完全に健全で信頼できる情報
- 1: ほぼ信頼できるが軽微な懸念あり
- 2: やや問題のある表現や情報
- 3: 明らかに問題のある情報や煽動的な内容
- 4: デマや誤情報の可能性が高い
- 5: 明確にデマ、釣り記事、有害な情報

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