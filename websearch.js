async function performWebSearch(query) {
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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'
            },
            body: JSON.stringify({
                query: query,
                search_depth: "advanced",
                include_answer: "advanced",
                max_results: 5
            })
        });

        if (!response.ok) {
            throw new Error(`Web search failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        // Store the search results globally
        window.lastSearchResults = data.results || [];

        // Format the response to include both the API-generated answer and sources
        let formattedResponse = '';
        
        if (data.answer) {
            formattedResponse = `API Generated Answer:\n${data.answer}\n\nKey Information from Sources:\n`;
        }

        // Add top 3 sources with their content
        formattedResponse += data.results.slice(0, 3).map(result => 
            `Source: ${result.title}\nContent: ${result.snippet || result.content || result.description}\n`
        ).join('\n');

        return formattedResponse;
    } catch (error) {
        console.error('Web search error:', error);
        window.lastSearchResults = null;
        throw error;
    }
}

// Simplify getFaviconUrl function
function getFaviconUrl(url) {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌐</text></svg>';
    }
}

// Export only needed functions
window.performWebSearch = performWebSearch;
window.getFaviconUrl = getFaviconUrl;
window.lastSearchResults = null;
