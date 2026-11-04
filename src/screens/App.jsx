import React, { useEffect, useMemo, useState } from "react";
import { createTrelloApi } from "../lib/trelloApi";

const APP_KEY = import.meta.env.VITE_TRELLO_API_KEY || "";

const steps = [
  "Select Boards",
  "Preview & Configure",
  "Confirm Merge",
  "Merge",
  "Complete"
];

const t = () =>
  window.TrelloPowerUp?.iframe({
    appKey: APP_KEY,
    appName: "Board Merge"
  });

function Icon({ name }) {
  const paths = {
    board: "M4 4h16v16H4z M8 8h3v8H8z M13 8h3v5h-3z",
    help: "M12 18h.01 M9.09 9a3 3 0 1 1 5.82 1c-.9 1-2.91 1.5-2.91 3",
    lists: "M4 6h2m3 0h11M4 12h2m3 0h11M4 18h2m3 0h11",
    card: "M5 4h14v16H5z M8 8h8",
    tag: "M3 12V4h8l10 10-7 7z",
    clip: "M8 12l6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l8-8"
  };

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name] || paths.board} />
    </svg>
  );
}

function Heading({ title, sub }) {
  return (
    <div className="heading">
      <h1>{title}</h1>
      <p>{sub}</p>
    </div>
  );
}

function Info({ title, children }) {
  return (
    <div className="info">
      <span className="info-icon">ⓘ</span>
      <div>
        {title && <b>{title}</b>}
        {children}
      </div>
    </div>
  );
}

function Footer({
  back,
  next,
  disabled,
  nextLabel = "Next →"
}) {
  return (
    <div className="footer">
      {back && (
        <button
          className="btn secondary"
          onClick={back}
        >
          ← Back
        </button>
      )}

      <button
        className="btn primary"
        disabled={disabled}
        onClick={next}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function Stat({ icon, n, label }) {
  return (
    <div className="stat">
      <span>
        <Icon name={icon} />
      </span>
      <b>{n}</b>
      <small>{label}</small>
    </div>
  );
}

function BoardPicker({
  title,
  value,
  boards,
  onChange,
  summary
}) {
  return (
    <section className="board-card">
      <div className="tiny-label">
        {title}
      </div>

      <label className="board-select">
        <span className="board-icon blue">
          <Icon name="board" />
        </span>

        <select
          value={value?.id || ""}
          onChange={(e) =>
            onChange(
              boards.find(
                (b) => b.id === e.target.value
              )
            )
          }
        >
          <option value="">
            Choose a Trello board
          </option>

          {boards.map((b) => (
            <option
              key={b.id}
              value={b.id}
            >
              {b.name}
            </option>
          ))}
        </select>

        <span className="chev">⌄</span>
      </label>

      {value && (
        <>
          <div className="preview-title">
            Board Preview
          </div>

          <div className="preview-stats">
            <div>
              <Icon name="lists" />
              <b>{summary?.lists ?? "—"}</b>
              <small>lists</small>
            </div>

            <div>
              <Icon name="card" />
              <b>{summary?.cards ?? "—"}</b>
              <small>cards</small>
            </div>

            <div>
              <Icon name="clip" />
              <b>{summary?.attachments ?? "—"}</b>
              <small>attachments</small>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default function App() {
  const [step, setStep] = useState(0);

  const [boards, setBoards] = useState([]);

  const [source, setSource] = useState(null);
  const [dest, setDest] = useState(null);

  const [authorized, setAuthorized] =
    useState(false);

  const [api, setApi] = useState(null);

  const [keyMissing, setKeyMissing] =
    useState(!APP_KEY);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [sourceLists, setSourceLists] =
    useState([]);

  const [destLists, setDestLists] =
    useState([]);

  const [sourceCards, setSourceCards] =
    useState([]);

  const [sourceLabels, setSourceLabels] =
    useState([]);

  const [destLabels, setDestLabels] =
    useState([]);

  const [chosen, setChosen] = useState([]);

  const [mapping, setMapping] = useState({});

  const [progress, setProgress] = useState({
    done: 0,
    total: 0,
    label: "Waiting to start"
  });

  const [result, setResult] = useState({
    status: "success",
    movedLists: 0,
    movedCards: 0,
    errors: []
  });

  const [help, setHelp] = useState(false);
  const [faq, setFaq] = useState(-1);

  // Initial Trello connection
  useEffect(() => {
    let active = true;

    async function boot() {
      if (!APP_KEY) {
        setLoading(false);
        setKeyMissing(true);
        return;
      }

      try {
        const trello = t();

        const rest = await trello.getRestApi();

        const ok = await rest.isAuthorized();

        if (!active) return;

        setAuthorized(ok);

        if (ok) {
          const token = await rest.getToken();

          const client = createTrelloApi(
            APP_KEY,
            token
          );

          setApi(client);

          const list = await client.boards();

          if (!active) return;

          const openBoards = (list || [])
            .filter((b) => !b.closed)
            .sort((a, b) =>
              a.name.localeCompare(b.name)
            );

          setBoards(openBoards);

          const context = await trello
            .getContext()
            .catch(() => ({}));

          const current = openBoards.find(
            (b) => b.id === context?.board
          );

          if (current) {
            setSource(current);
          }
        }
      } catch (e) {
        if (active) {
          setError(
            e.message ||
              "Could not connect to Trello."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    boot();

    return () => {
      active = false;
    };
  }, []);

  const sourceSummary = useMemo(
    () => ({
      lists: sourceLists.length,
      cards: sourceCards.length,
      attachments: sourceCards.reduce(
        (n, c) =>
          n + (c.attachments?.length || 0),
        0
      )
    }),
    [sourceLists, sourceCards]
  );

  const destSummary = useMemo(
    () => ({
      lists: destLists.length,
      cards: 0,
      attachments: 0
    }),
    [destLists]
  );

  const selectedCards = useMemo(
    () =>
      sourceCards.filter((c) =>
        chosen.includes(c.idList)
      ).length,
    [sourceCards, chosen]
  );

  // Trello authorization
  async function authorize() {
    setBusy(true);
    setError("");

    try {
      const rest = await t().getRestApi();

      await rest.authorize({
        scope: "read,write",
        expiration: "never"
      });

      const token = await rest.getToken();

      const client = createTrelloApi(
        APP_KEY,
        token
      );

      const list = await client.boards();

      setApi(client);

      setBoards(
        (list || [])
          .filter((b) => !b.closed)
          .sort((a, b) =>
            a.name.localeCompare(b.name)
          )
      );

      setAuthorized(true);
    } catch (e) {
      setError(
        e.message ||
          "Trello authorization was cancelled or failed."
      );
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }

  // Load live source and destination board data
  async function loadMergePreview() {
    if (
      !source ||
      !dest ||
      source.id === dest.id
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const [
        lists,
        cards,
        dLists,
        sLabels,
        dLabels
      ] = await Promise.all([
        api.lists(source.id),
        api.cards(source.id),
        api.lists(dest.id),
        api.labels(source.id),
        api.labels(dest.id)
      ]);

      const activeLists = (lists || []).filter(
        (l) => !l.closed
      );

      const activeCards = (cards || []).filter(
        (c) => !c.closed
      );

      setSourceLists(activeLists);
      setSourceCards(activeCards);

      setDestLists(
        (dLists || []).filter((l) => !l.closed)
      );

      setSourceLabels(sLabels || []);
      setDestLabels(dLabels || []);

      setChosen(
        activeLists.map((l) => l.id)
      );

      setMapping(
        Object.fromEntries(
          activeLists.map((l) => [
            l.id,
            "create"
          ])
        )
      );

      setStep(1);
    } catch (e) {
      setError(
        e.message ||
          "Unable to read source/destination board data."
      );
    } finally {
      setBusy(false);
    }
  }

  // REAL MERGE OPERATION
  async function executeMerge() {
    setStep(3);
    setBusy(true);
    setError("");

    const errors = [];

    let movedLists = 0;
    let movedCards = 0;

    const total =
      selectedCards + chosen.length;

    let done = 0;

    setProgress({
      done: 0,
      total,
      label: "Preparing destination labels"
    });

    try {
      // Map source labels to destination labels
      const labelMap = {};

      for (const label of sourceLabels) {
        let match = destLabels.find(
          (d) =>
            d.name === label.name &&
            d.color === label.color
        );

        if (!match) {
          try {
            match = await api.createLabel(
              dest.id,
              label.name || "Imported label",
              label.color || "null"
            );

            destLabels.push(match);
          } catch (e) {
            errors.push({
              item: `Label: ${label.name}`,
              reason: e.message
            });

            continue;
          }
        }

        labelMap[label.id] = match.id;
      }

      // Process selected source lists
      for (const list of sourceLists.filter(
        (l) => chosen.includes(l.id)
      )) {
        let destinationListId =
          mapping[list.id];

        // Create a destination list if required
        if (
          destinationListId === "create" ||
          !destinationListId
        ) {
          try {
            const newList =
              await api.createList(
                dest.id,
                list.name
              );

            destinationListId = newList.id;

            setDestLists((old) => [
              ...old,
              newList
            ]);
          } catch (e) {
            errors.push({
              item: `List: ${list.name}`,
              reason: e.message
            });

            done++;

            setProgress({
              done,
              total,
              label: `Skipped list ${list.name}`
            });

            continue;
          }
        }

        const cardsInList = sourceCards.filter(
          (c) => c.idList === list.id
        );

        let listFailed = false;

        // Move cards one by one
        for (const card of cardsInList) {
          try {
            await api.moveCard(
              card.id,
              destinationListId
            );

            const mappedIds = (
              card.labels || []
            )
              .map((l) => labelMap[l.id])
              .filter(Boolean);

            // Remove source labels
            for (const oldLabel of (
              card.labels || []
            )) {
              try {
                await api.removeLabelFromCard(
                  card.id,
                  oldLabel.id
                );
              } catch {
                // Trello may already detach source labels
              }
            }

            // Add mapped destination labels
            if (mappedIds.length) {
              for (const labelId of mappedIds) {
                await api.addLabelToCard(
                  card.id,
                  labelId
                );
              }
            }

            movedCards++;
            done++;

            setProgress({
              done,
              total,
              label: `Moving card: ${card.name}`
            });
          } catch (e) {
            errors.push({
              item: `Card: ${card.name}`,
              reason: e.message
            });

            done++;

            setProgress({
              done,
              total,
              label: `Failed card: ${card.name}`
            });

            listFailed = true;
          }
        }

        // Archive source list only after successful movement
        if (!listFailed) {
          try {
            await api.archiveList(list.id);

            movedLists++;
            done++;

            setProgress({
              done,
              total,
              label: `Completed list: ${list.name}`
            });
          } catch (e) {
            errors.push({
              item: `List: ${list.name}`,
              reason: e.message
            });

            done++;
          }
        }
      }

      setResult({
        status: errors.length
          ? movedCards || movedLists
            ? "partial"
            : "error"
          : "success",

        movedLists,
        movedCards,
        errors
      });

      setStep(4);
    } catch (e) {
      setResult({
        status:
          movedCards || movedLists
            ? "partial"
            : "error",

        movedLists,
        movedCards,

        errors: [
          ...errors,
          {
            item: "Merge",
            reason: e.message
          }
        ]
      });

      setStep(4);
    } finally {
      setBusy(false);
    }
  }

  const statusTitle =
    result.status === "success"
      ? "Merge Completed Successfully!"
      : result.status === "partial"
      ? "Merge Completed with Some Errors"
      : "Merge Failed";

  return (
    <div className="app-shell">

      {/* HEADER */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="board" />
          </span>

          <b>Board Merge</b>

          <span className="live-tag">
            Trello connected
          </span>
        </div>

        <button
          className="close"
          aria-label="Close"
          onClick={() =>
            window.TrelloPowerUp
              ?.iframe({
                appKey: APP_KEY,
                appName: "Board Merge"
              })
              .closeModal?.()
          }
        >
          ×
        </button>
      </header>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <button
          className={
            !help ? "nav active" : "nav"
          }
          onClick={() => {
            setHelp(false);
            setStep(0);
          }}
        >
          <Icon name="board" />
          Merge Boards
        </button>

        <button
          className={
            help ? "nav active" : "nav"
          }
          onClick={() => setHelp(true)}
        >
          <Icon name="help" />
          Help
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">

        {help ? (
          <Help
            faq={faq}
            setFaq={setFaq}
          />
        ) : (
          <>
            {/* STEP PROGRESS */}
            <div className="stepper">
              {steps.map((s, i) => (
                <div
                  className={`step ${
                    i < step
                      ? "done"
                      : i === step
                      ? "current"
                      : ""
                  }`}
                  key={s}
                >
                  <span>
                    {i < step ? "✓" : i + 1}
                  </span>

                  <small>{s}</small>
                </div>
              ))}
            </div>

            {/* API KEY WARNING */}
            {keyMissing && (
              <div className="warning-box">
                <b>Trello API key required</b>

                <p>
                  Add{" "}
                  <code>
                    VITE_TRELLO_API_KEY
                  </code>{" "}
                  to your Vercel environment variables.
                  Generate the key in Trello Power-Up
                  Admin → Authorization → Trello Auth.
                </p>
              </div>
            )}

            {/* LOADING */}
            {!keyMissing && loading && (
              <div className="loading">
                Loading your Trello boards…
              </div>
            )}

            {/* AUTHORIZATION */}
            {!keyMissing &&
              !loading &&
              !authorized && (
                <div className="auth-card">
                  <span className="auth-icon">
                    🔐
                  </span>

                  <h2>
                    Connect your Trello account
                  </h2>

                  <p>
                    Board Merge needs read and write
                    permission to read your boards and
                    move lists/cards into the
                    destination board.
                  </p>

                  <button
                    className="btn primary"
                    disabled={busy}
                    onClick={authorize}
                  >
                    {busy
                      ? "Connecting…"
                      : "Authorize Trello"}
                  </button>
                </div>
              )}

            {/* ERROR */}
            {error && (
              <div className="error-banner">
                <b>Something went wrong</b>

                <p>{error}</p>

                <button
                  className="btn secondary"
                  onClick={() => setError("")}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* STEP 1 */}
            {authorized && step === 0 && (
              <>
                <Heading
                  title="Select Boards to Merge"
                  sub="Choose the source board to move lists/cards from and the destination board to move them into."
                />

                <div className="board-pair">
                  <BoardPicker
                    title="Source Board"
                    value={source}
                    boards={boards}
                    onChange={setSource}
                    summary={sourceSummary}
                  />

                  <div className="arrow">
                    →
                  </div>

                  <BoardPicker
                    title="Destination Board"
                    value={dest}
                    boards={boards}
                    onChange={setDest}
                    summary={destSummary}
                  />
                </div>

                <Info title="Before you merge">
                  <ul>
                    <li>
                      Choose boards where you have
                      permission to move content.
                    </li>

                    <li>
                      Selected source lists are
                      consolidated into mapped
                      destination lists or new lists.
                    </li>

                    <li>
                      Cards are moved using Trello’s API.
                    </li>

                    <li>
                      Source lists are archived only
                      after their cards move
                      successfully.
                    </li>

                    <li>
                      Review everything before
                      confirming. Merge actions cannot
                      be automatically rolled back.
                    </li>
                  </ul>
                </Info>

                <Footer
                  next={loadMergePreview}
                  disabled={
                    !source ||
                    !dest ||
                    source.id === dest.id ||
                    busy
                  }
                  nextLabel={
                    busy
                      ? "Loading…"
                      : "Next →"
                  }
                />
              </>
            )}

            {/* STEP 2 */}
            {authorized && step === 1 && (
              <>
                <Heading
                  title="Preview & Configure"
                  sub="Select source lists and choose an existing destination list or create a matching list."
                />

                <div className="board-summary">
                  <div>
                    <b>Source Board</b>
                    <strong>{source?.name}</strong>
                    <small>
                      {sourceLists.length} lists ·{" "}
                      {sourceCards.length} cards
                    </small>
                  </div>

                  <div className="arrow">→</div>

                  <div>
                    <b>Destination Board</b>
                    <strong>{dest?.name}</strong>
                    <small>
                      {destLists.length} lists
                    </small>
                  </div>
                </div>

                <div className="section-title">
                  <div>
                    <b>Select Lists to Move</b>
                    <small>
                      Uncheck any list you want to
                      keep on the source board.
                    </small>
                  </div>

                  <label className="select-all">
                    <input
                      type="checkbox"
                      checked={
                        chosen.length ===
                        sourceLists.length
                      }
                      onChange={(e) =>
                        setChosen(
                          e.target.checked
                            ? sourceLists.map(
                                (l) => l.id
                              )
                            : []
                        )
                      }
                    />

                    Select All ({sourceLists.length})
                  </label>
                </div>

                <div className="list-table">
                  <div className="table-head">
                    <span></span>
                    <span>List Name</span>
                    <span>Cards</span>
                    <span>
                      Move to destination list
                    </span>
                  </div>

                  {sourceLists.map((list, i) => (
                    <div
                      className="table-row"
                      key={list.id}
                    >
                      <span>
                        <input
                          type="checkbox"
                          checked={chosen.includes(
                            list.id
                          )}
                          onChange={(e) =>
                            setChosen((old) =>
                              e.target.checked
                                ? [...old, list.id]
                                : old.filter(
                                    (id) =>
                                      id !== list.id
                                  )
                            )
                          }
                        />
                      </span>

                      <span>
                        <i
                          className="list-color"
                          style={{
                            background: [
                              "#a855f7",
                              "#0f9d73",
                              "#1264f5",
                              "#f4b400",
                              "#ef4444",
                              "#f97316",
                              "#dc2626",
                              "#38bdf8"
                            ][i % 8]
                          }}
                        />

                        {list.name}
                      </span>

                      <span>
                        {
                          sourceCards.filter(
                            (c) =>
                              c.idList === list.id
                          ).length
                        }
                      </span>

                      <span>
                        <select
                          value={
                            mapping[list.id] ||
                            "create"
                          }
                          onChange={(e) =>
                            setMapping((old) => ({
                              ...old,
                              [list.id]:
                                e.target.value
                            }))
                          }
                        >
                          <option value="create">
                            Create “{list.name}”
                          </option>

                          {destLists.map((dl) => (
                            <option
                              key={dl.id}
                              value={dl.id}
                            >
                              {dl.name}
                            </option>
                          ))}
                        </select>
                      </span>
                    </div>
                  ))}
                </div>

                <Footer
                  back={() => setStep(0)}
                  next={() => setStep(2)}
                  nextLabel="Next →"
                  disabled={!chosen.length}
                />
              </>
            )}

            {/* STEP 3 */}
            {authorized && step === 2 && (
              <>
                <Heading
                  title="Confirm Merge"
                  sub="Review the selected lists and target mapping. Start Merge will make real changes in Trello."
                />

                <div className="board-summary">
                  <div>
                    <b>Source Board</b>
                    <strong>{source?.name}</strong>
                    <small>
                      {chosen.length} selected lists ·{" "}
                      {selectedCards} cards
                    </small>
                  </div>

                  <div className="arrow">→</div>

                  <div>
                    <b>Destination Board</b>
                    <strong>{dest?.name}</strong>
                    <small>
                      {destLists.length} current lists
                    </small>
                  </div>
                </div>

                <div className="merge-summary">
                  <b>Merge Summary</b>

                  <div className="stats-grid">
                    <Stat
                      icon="lists"
                      n={chosen.length}
                      label="lists selected"
                    />

                    <Stat
                      icon="card"
                      n={selectedCards}
                      label="cards to move"
                    />

                    <Stat
                      icon="tag"
                      n={sourceLabels.length}
                      label="source labels to map"
                    />

                    <Stat
                      icon="clip"
                      n={sourceSummary.attachments}
                      label="attachments on cards"
                    />
                  </div>
                </div>

                <div className="compact-table">
                  <b>Selected Lists</b>

                  <div className="table-head">
                    <span>Source List</span>
                    <span>Cards</span>
                    <span>Destination</span>
                  </div>

                  {sourceLists
                    .filter((l) =>
                      chosen.includes(l.id)
                    )
                    .map((l) => (
                      <div
                        className="table-row"
                        key={l.id}
                      >
                        <span>{l.name}</span>

                        <span>
                          {
                            sourceCards.filter(
                              (c) =>
                                c.idList === l.id
                            ).length
                          }
                        </span>

                        <span>
                          {mapping[l.id] === "create"
                            ? `New list “${l.name}”`
                            : destLists.find(
                                (dl) =>
                                  dl.id ===
                                  mapping[l.id]
                              )?.name ||
                              "Destination list"}
                        </span>
                      </div>
                    ))}
                </div>

                <Info title="Important">
                  <ul>
                    <li>
                      This performs real Trello API
                      moves. It is not a simulation.
                    </li>

                    <li>
                      Card movement is sequential.
                      Keep this window open.
                    </li>

                    <li>
                      Some Trello content or
                      permissions may limit moving a
                      card.
                    </li>

                    <li>
                      There is no automatic undo.
                      Confirm the boards carefully.
                    </li>
                  </ul>
                </Info>

                <Footer
                  back={() => setStep(1)}
                  next={executeMerge}
                  nextLabel={
                    busy
                      ? "Merging…"
                      : "Start Merge"
                  }
                  disabled={busy}
                />
              </>
            )}

            {/* STEP 4 */}
            {authorized && step === 3 && (
              <>
                <Heading
                  title="Merging Boards"
                  sub="Moving selected cards to their destination lists. Please keep this window open."
                />

                <div className="progress-panel">
                  <div className="ring">
                    <b>
                      {progress.total
                        ? Math.min(
                            100,
                            Math.round(
                              (progress.done /
                                progress.total) *
                                100
                            )
                          )
                        : 0}
                      %
                    </b>
                  </div>

                  <div className="progress-copy">
                    <b>{progress.label}</b>

                    <small>
                      {progress.done} of{" "}
                      {progress.total} tasks completed
                    </small>
                  </div>

                  <div className="progress-steps">
                    <p className="active">
                      <span>◉</span>
                      Moving selected lists and cards
                      <small>In progress</small>
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* STEP 5 */}
            {authorized && step === 4 && (
              <div className="complete">
                <div
                  className={`status-icon ${
                    result.status === "success"
                      ? "green"
                      : result.status === "error"
                      ? "red"
                      : "orange"
                  }`}
                >
                  {result.status === "success"
                    ? "✓"
                    : result.status === "error"
                    ? "×"
                    : "!"}
                </div>

                <h1>{statusTitle}</h1>

                <p>
                  {result.status === "success"
                    ? "Selected cards were moved to the destination board."
                    : result.status === "partial"
                    ? "Some items moved successfully; review the failures below."
                    : "No items could be moved. Review the errors and permissions."}
                </p>

                <div className="board-summary">
                  <div>
                    <b>Source Board</b>
                    <strong>{source?.name}</strong>
                  </div>

                  <div className="arrow">→</div>

                  <div>
                    <b>Destination Board</b>
                    <strong>{dest?.name}</strong>
                  </div>
                </div>

                <div className="merge-summary">
                  <b>Actual Merge Results</b>

                  <div className="stats-grid">
                    <Stat
                      icon="lists"
                      n={result.movedLists}
                      label="source lists archived"
                    />

                    <Stat
                      icon="card"
                      n={result.movedCards}
                      label="cards moved"
                    />

                    <Stat
                      icon="tag"
                      n={sourceLabels.length}
                      label="source labels reviewed"
                    />

                    <Stat
                      icon="clip"
                      n={sourceSummary.attachments}
                      label="attachments on moved cards"
                    />
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="error-box">
                    <b>
                      {result.errors.length} item(s)
                      need attention
                    </b>

                    {result.errors.map((e, i) => (
                      <div
                        className="error-row"
                        key={i}
                      >
                        <strong>{e.item}</strong>
                        <p>{e.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {result.status === "success" && (
                  <div className="success-box">
                    ✓ &nbsp; All selected cards were
                    moved successfully.
                  </div>
                )}

                <div className="footer">
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setStep(0);
                      setSourceLists([]);
                      setSourceCards([]);
                      setChosen([]);
                      setError("");
                    }}
                  >
                    Merge Another Pair
                  </button>

                  <button
                    className="btn primary"
                    onClick={() =>
                      window.TrelloPowerUp
                        ?.iframe({
                          appKey: APP_KEY,
                          appName: "Board Merge"
                        })
                        .closeModal?.()
                    }
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// HELP & SUPPORT
function Help({ faq, setFaq }) {
  const questions = [
    "Do I need special permissions to merge boards?",
    "What items are moved during the merge?",
    "Will the source board be deleted?",
    "What happens if some items cannot be moved?",
    "How long does the merge take?"
  ];

  const answers = [
    "You need read/write access to both boards. Trello may block cross-workspace or restricted board moves.",

    "Cards are moved through Trello’s API. Trello retains card data it supports for cross-board moves, while membership and label behavior depends on board permissions.",

    "No. Source lists are archived after successful card movement; the source board remains.",

    "The final report lists each item and the API error. Fix the permission or limit and retry the remaining content manually.",

    "It depends on the selected lists and card count. Items are moved sequentially to reduce API throttling."
  ];

  return (
    <div className="help-page">
      <Heading
        title="Help & Support"
        sub="Learn how to use Board Merge and get answers to common questions."
      />

      <h3>How to Merge Boards</h3>

      <div className="help-steps">
        {steps.map((s, i) => (
          <div key={s}>
            <span>{i + 1}</span>

            <b>{s}</b>

            <small>
              {
                [
                  "Choose source and destination boards.",
                  "Select lists and destination mapping.",
                  "Review and confirm the merge.",
                  "Cards are moved through Trello.",
                  "See the completed or partial-failure report."
                ][i]
              }
            </small>
          </div>
        ))}
      </div>

      <Info title="Important Notes">
        <ul>
          <li>
            This is a real Trello operation, not a
            mock preview.
          </li>

          <li>
            Source lists are archived only after
            their cards are moved.
          </li>

          <li>
            Ensure you have permission on both boards.
          </li>

          <li>
            There is no automatic rollback.
          </li>
        </ul>
      </Info>

      <h3>Frequently Asked Questions</h3>

      {questions.map((question, i) => (
        <div
          className="faq"
          key={question}
        >
          <button
            onClick={() =>
              setFaq(faq === i ? -1 : i)
            }
          >
            {question}

            <span>
              {faq === i ? "⌃" : "⌄"}
            </span>
          </button>

          {faq === i && (
            <p>{answers[i]}</p>
          )}
        </div>
      ))}
    </div>
  );
}