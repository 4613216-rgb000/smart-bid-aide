const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, keywords } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract markdown content
    const markdown = data.data?.markdown || data.markdown || '';
    const metadata = data.data?.metadata || data.metadata || {};
    const links = data.data?.links || data.links || [];

    // Use AI to parse tender info from markdown
    const aiApiKey = Deno.env.get('LOVABLE_API_KEY');
    let parsedTenders: any[] = [];

    if (aiApiKey && markdown) {
      const keywordFilter = keywords?.length > 0 
        ? `只提取包含以下关键词之一的招标项目: ${keywords.join(', ')}。` 
        : '';

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `你是一个招标信息提取助手。从网页内容中提取招标公告信息，返回JSON数组。${keywordFilter}
每条记录包含: title(项目名称), client(招标方), industry(行业), budget(预算范围), deadline(截止日期,YYYY-MM-DD格式), requirements(需求摘要)。
如果某个字段无法确定，用null。只返回JSON数组，不要其他文字。如果没有招标信息返回空数组[]。`
            },
            {
              role: 'user',
              content: `请从以下网页内容中提取招标公告信息:\n\n${markdown.substring(0, 8000)}`
            }
          ],
          temperature: 0.1,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '[]';
        try {
          // Extract JSON from possible markdown code block
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsedTenders = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tenders: parsedTenders,
        rawMarkdown: markdown.substring(0, 2000),
        sourceUrl: formattedUrl,
        metadata,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
