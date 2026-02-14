const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, keywords, limit } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search query is required' }),
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

    // Build search query with keywords
    let searchQuery = query;
    if (keywords?.length > 0) {
      searchQuery = `${query} ${keywords.join(' ')}`;
    }

    console.log('Searching:', searchQuery);

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: limit || 10,
        lang: 'zh-cn',
        country: 'cn',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl search error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Search failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect search results content
    const results = data.data || [];
    const contentParts = results.map((r: any, i: number) => 
      `--- 结果${i+1}: ${r.title || '未知'} (${r.url || ''}) ---\n${(r.markdown || r.description || '').substring(0, 2000)}`
    ).join('\n\n');

    // Use AI to parse tender info
    const aiApiKey = Deno.env.get('LOVABLE_API_KEY');
    let parsedTenders: any[] = [];

    if (aiApiKey && contentParts) {
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
              content: `你是一个招标信息提取助手。从搜索结果中提取招标公告信息，返回JSON数组。
每条记录包含: title(项目名称), client(招标方), industry(行业), budget(预算范围), deadline(截止日期,YYYY-MM-DD格式), requirements(需求摘要), source_url(来源链接)。
如果某个字段无法确定，用null。只返回JSON数组，不要其他文字。如果没有招标信息返回空数组[]。
注意去重，相同项目只保留一条。`
            },
            {
              role: 'user',
              content: `请从以下搜索结果中提取招标公告信息:\n\n${contentParts.substring(0, 12000)}`
            }
          ],
          temperature: 0.1,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '[]';
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsedTenders = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    }

    console.log(`Found ${parsedTenders.length} tenders from ${results.length} search results`);

    return new Response(
      JSON.stringify({
        success: true,
        tenders: parsedTenders,
        searchResultCount: results.length,
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
