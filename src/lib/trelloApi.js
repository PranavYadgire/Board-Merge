const API_BASE = "https://api.trello.com/1";

export function createTrelloApi(key, token) {
  if (!key || !token) {
    throw new Error(
      "Trello API key and authorization token are required."
    );
  }

  async function request(
    path,
    method = "GET",
    params = {},
    body = undefined
  ) {
    const url = new URL(`${API_BASE}${path}`);

    url.searchParams.set("key", key);
    url.searchParams.set("token", token);

    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    });

    const response = await fetch(url, {
      method,

      headers: body
        ? { "Content-Type": "application/json" }
        : {},

      body: body
        ? JSON.stringify(body)
        : undefined
    });

    const payload =
      response.status === 204
        ? null
        : await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.error ||
        `Trello API error (${response.status})`;

      throw new Error(message);
    }

    return payload;
  }

  return {
    boards: () =>
      request("/members/me/boards", "GET", {
        fields: "id,name,closed,prefs",
        filter: "open"
      }),

    lists: (boardId) =>
      request(`/boards/${boardId}/lists`, "GET", {
        fields: "id,name,closed,pos",
        filter: "open"
      }),

    cards: (boardId) =>
      request(`/boards/${boardId}/cards`, "GET", {
        fields:
          "id,name,idList,idBoard,desc,due,dueComplete,labels,idMembers,closed,pos",
        attachments: "true",
        checklists: "all",
        members: "true",
        filter: "open"
      }),

    labels: (boardId) =>
      request(`/boards/${boardId}/labels`, "GET", {
        fields: "id,name,color"
      }),

    createLabel: (boardId, name, color) =>
      request(
        `/boards/${boardId}/labels`,
        "POST",
        {},
        {
          idBoard: boardId,
          name,
          color
        }
      ),

    createList: (boardId, name) =>
      request(
        "/lists",
        "POST",
        {},
        {
          idBoard: boardId,
          name,
          pos: "bottom"
        }
      ),

    moveCard: (cardId, destListId) =>
      request(
        `/cards/${cardId}`,
        "PUT",
        {},
        {
          idList: destListId,
          pos: "bottom"
        }
      ),

    moveList: (listId, destBoardId) =>
      request(
        `/lists/${listId}/idBoard`,
        "PUT",
        {},
        {
          value: destBoardId
        }
      ),

    archiveList: (listId) =>
      request(
        `/lists/${listId}/closed`,
        "PUT",
        {},
        {
          value: true
        }
      ),

    updateCardLabels: (cardId, labelIds) =>
      request(
        `/cards/${cardId}`,
        "PUT",
        {},
        {
          idLabels: labelIds.join(",")
        }
      ),

    addLabelToCard: (cardId, labelId) =>
      request(
        `/cards/${cardId}/idLabels`,
        "POST",
        {},
        {
          value: labelId
        }
      ),

    removeLabelFromCard: (cardId, labelId) =>
      request(
        `/cards/${cardId}/idLabels/${labelId}`,
        "DELETE"
      )
  };
}