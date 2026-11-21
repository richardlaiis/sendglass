import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { readClock } from "../../app/clock";
import { navigate } from "../../app/router";
import { useSettings } from "../../app/SettingsContext";
import { useNow } from "../../app/useNow";
import { AppBar } from "../../components/AppBar";
import { Dialog } from "../../components/Dialog";
import { Hourglass } from "../../components/Hourglass";
import { DeleteIcon } from "../../components/icons";
import { ProgressReadout } from "../../components/ProgressReadout";
import { ShatterReveal } from "../../components/ShatterReveal";
import { useSnackbar } from "../../components/SnackbarContext";
import { useCapsuleProgress } from "../../components/useCapsuleProgress";
import {
  addReply,
  markHappened,
  openCapsule,
  openEarly,
  validateReply,
} from "../../domain/actions";
import { REPLY_MAX } from "../../domain/config";
import { getStatus } from "../../domain/status";
import type { Capsule, CapsuleChanges } from "../../domain/types";
import { formatDateTime, formatRelativePast } from "../../i18n/format";
import { useRepositories } from "../../storage/StorageContext";
import { ConfirmChain } from "./ConfirmChain";
import { EarlyBadge } from "./EarlyBadge";
import { clearJustOpened, wasJustOpened } from "./justOpened";

type OpenDialog = "happened" | "delete" | null;

export function CapsulePage({ id }: { id: string }) {
  const { t } = useTranslation();
  const { capsules: repo } = useRepositories();
  const { settings, loaded } = useSettings();
  const snackbar = useSnackbar();
  const now = useNow();

  /** undefined = loading, null = not found. */
  const [capsule, setCapsule] = useState<Capsule | null | undefined>(undefined);
  const [reveal, setReveal] = useState(() => wasJustOpened(id));
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [chainActive, setChainActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => clearJustOpened(id), [id]);

  useEffect(() => {
    let cancelled = false;
    void repo.get(id).then((c) => {
      if (!cancelled) setCapsule(c ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [repo, id]);

  // SPEC §5: arriving at a sealed capsule with early opening off shows a gentle toast.
  const arrivalHandled = useRef(false);
  useEffect(() => {
    if (arrivalHandled.current || !loaded || !capsule) return;
    arrivalHandled.current = true;
    if (getStatus(capsule, readClock()) === "sealed" && !settings.allowEarlyOpen) {
      snackbar.show(t("capsule.stillSealed"));
    }
  }, [loaded, capsule, settings.allowEarlyOpen, snackbar, t]);

  async function run(action: (c: Capsule) => Promise<void>) {
    if (!capsule || busy) return;
    setBusy(true);
    try {
      await action(capsule);
    } catch {
      snackbar.show(t("capsule.failed"));
    } finally {
      setBusy(false);
    }
  }

  async function apply(changes: CapsuleChanges) {
    await repo.update(id, changes);
    setCapsule((c) => c && { ...c, ...changes });
  }

  const open = () =>
    run(async (c) => {
      await apply(openCapsule(c, readClock()));
      setReveal(true);
    });

  const openAfterChain = (confirmations: number) => {
    setChainActive(false);
    void run(async (c) => {
      const at = readClock();
      // If it became ready while the chain was open, it's a normal opening after all.
      await apply(
        getStatus(c, at) === "sealed" ? openEarly(c, at, confirmations) : openCapsule(c, at),
      );
      setReveal(true);
    });
  };

  const confirmHappened = () => {
    setDialog(null);
    void run((c) => apply(markHappened(c, readClock())));
  };

  const confirmDelete = () => {
    setDialog(null);
    void run(async (c) => {
      await repo.delete(c.id);
      navigate("#/");
      snackbar.show(t("capsule.deleted"));
    });
  };

  const status = capsule ? getStatus(capsule, now) : null;

  return (
    <>
      <AppBar title={t("capsule.appBar")} back />
      <main className="page">
        {capsule === null && (
          <div className="empty-state">
            <p className="empty-state__title">{t("capsule.notFound")}</p>
            <a className="btn btn--text" href="#/">
              {t("nav.home")}
            </a>
          </div>
        )}

        {capsule && status === "sealed" && (
          <SealedView
            capsule={capsule}
            now={now}
            busy={busy}
            allowEarlyOpen={settings.allowEarlyOpen}
            onHappened={() => setDialog("happened")}
            onBreakSeal={() => setChainActive(true)}
          />
        )}

        {capsule && status === "ready" && (
          <ReadyView capsule={capsule} now={now} busy={busy} onOpen={() => void open()} />
        )}

        {capsule && status === "opened" && (
          <OpenedView
            capsule={capsule}
            now={now}
            reveal={reveal}
            onRevealDone={() => setReveal(false)}
            onReply={(text) =>
              run(async (c) => {
                await apply(addReply(c, text, readClock()));
                snackbar.show(t("capsule.replySaved"));
              })
            }
          />
        )}

        {capsule && (
          <div className="danger-zone">
            <button
              type="button"
              className="btn btn--text btn--danger"
              onClick={() => setDialog("delete")}
              disabled={busy}
            >
              <DeleteIcon />
              {t("capsule.delete")}
            </button>
          </div>
        )}
      </main>

      {capsule?.unlock.type === "event" && (
        <Dialog
          open={dialog === "happened"}
          title={t("capsule.happenedTitle")}
          onCancel={() => setDialog(null)}
          actions={
            <>
              <button
                type="button"
                className="btn btn--text"
                data-autofocus
                onClick={() => setDialog(null)}
              >
                {t("capsule.notYet")}
              </button>
              <button type="button" className="btn btn--filled" onClick={confirmHappened}>
                {t("capsule.happenedConfirm")}
              </button>
            </>
          }
        >
          <p>{t("capsule.happenedBody", { event: capsule.unlock.label })}</p>
        </Dialog>
      )}

      <Dialog
        open={dialog === "delete"}
        title={t("capsule.deleteTitle")}
        onCancel={() => setDialog(null)}
        actions={
          <>
            <button
              type="button"
              className="btn btn--text"
              data-autofocus
              onClick={() => setDialog(null)}
            >
              {t("capsule.cancel")}
            </button>
            <button
              type="button"
              className="btn btn--filled btn--filled-danger"
              onClick={confirmDelete}
            >
              {t("capsule.delete")}
            </button>
          </>
        }
      >
        <p>{t("capsule.deleteBody")}</p>
      </Dialog>

      {chainActive && capsule && status === "sealed" && (
        <ConfirmChain
          capsule={capsule}
          now={now}
          onAbort={() => setChainActive(false)}
          onComplete={openAfterChain}
        />
      )}
    </>
  );
}

function CapsuleTitle({ capsule }: { capsule: Capsule }) {
  const { t } = useTranslation();
  if (capsule.title) return <h2 className="detail__title">{capsule.title}</h2>;
  return (
    <h2 className="detail__title">
      <span aria-hidden="true" className="masked">
        {t("home.hiddenTitle")}
      </span>
      <span className="visually-hidden">{t("home.untitled")}</span>
    </h2>
  );
}

interface SealedViewProps {
  capsule: Capsule;
  now: number;
  busy: boolean;
  allowEarlyOpen: boolean;
  onHappened: () => void;
  onBreakSeal: () => void;
}

function SealedView({
  capsule,
  now,
  busy,
  allowEarlyOpen,
  onHappened,
  onBreakSeal,
}: SealedViewProps) {
  const { t, i18n } = useTranslation();
  const view = useCapsuleProgress(capsule, now);
  const isEvent = capsule.unlock.type === "event";

  return (
    <section className="detail">
      <CapsuleTitle capsule={capsule} />
      {view && (
        <div className="detail__progress">
          <Hourglass state={view.state} {...view.hourglass} size="large" />
          <ProgressReadout view={view} size="large" />
        </div>
      )}
      <p className="detail__meta">
        {t("capsule.createdAt", { date: formatDateTime(i18n.language, capsule.createdAt) })}
      </p>
      <p className="detail__hidden">{t("capsule.contentHidden")}</p>
      <div className="detail__actions">
        {isEvent && (
          <button type="button" className="btn btn--filled" onClick={onHappened} disabled={busy}>
            {t("capsule.itHappened")}
          </button>
        )}
        {allowEarlyOpen && (
          <button type="button" className="btn btn--text" onClick={onBreakSeal} disabled={busy}>
            {t("capsule.breakSeal")}
          </button>
        )}
      </div>
    </section>
  );
}

function ReadyView({
  capsule,
  now,
  busy,
  onOpen,
}: {
  capsule: Capsule;
  now: number;
  busy: boolean;
  onOpen: () => void;
}) {
  const { t, i18n } = useTranslation();
  const view = useCapsuleProgress(capsule, now);
  return (
    <section className="detail detail--ready">
      <CapsuleTitle capsule={capsule} />
      {view && (
        <div className="detail__progress">
          <Hourglass state={view.state} {...view.hourglass} size="large" />
        </div>
      )}
      <p className="detail__primary">
        {capsule.unlock.type === "event"
          ? t("capsule.readyEvent", { event: capsule.unlock.label })
          : t("capsule.readyTime")}
      </p>
      <p className="detail__meta">
        {t("capsule.createdAt", { date: formatDateTime(i18n.language, capsule.createdAt) })}
      </p>
      <div className="detail__actions">
        <button
          type="button"
          className="btn btn--filled btn--large"
          onClick={onOpen}
          disabled={busy}
        >
          {t("capsule.open")}
        </button>
      </div>
    </section>
  );
}

interface OpenedViewProps {
  capsule: Capsule;
  now: number;
  /** Play the shatter reveal (just opened). */
  reveal: boolean;
  onRevealDone: () => void;
  onReply: (text: string) => Promise<void>;
}

function OpenedView({ capsule, now, reveal, onRevealDone, onReply }: OpenedViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const replyId = useId();
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);

  function saveReply() {
    const error = validateReply(reply);
    if (error) {
      setReplyError(
        error === "replyTooLong"
          ? t("capsule.replyTooLong", { count: REPLY_MAX })
          : t("capsule.replyEmpty"),
      );
      return;
    }
    setReplyError(null);
    void onReply(reply);
  }

  const note = (
    <article className="note">
      {capsule.title && <h2 className="note__title">{capsule.title}</h2>}
      <p className="note__body">{capsule.content}</p>
      <p className="note__meta">
        {t("capsule.written", {
          relative: formatRelativePast(locale, now - capsule.createdAt),
          datetime: formatDateTime(locale, capsule.createdAt),
        })}
      </p>
      {capsule.openedAt !== undefined && (
        <p className="note__meta">
          {t("capsule.openedOn", { date: formatDateTime(locale, capsule.openedAt) })}
        </p>
      )}
      <EarlyBadge capsule={capsule} />
    </article>
  );

  // The reply waits until the note has risen into place.
  if (reveal) {
    return (
      <ShatterReveal seed={capsule.id} onDone={onRevealDone}>
        {note}
      </ShatterReveal>
    );
  }

  return (
    <>
      {note}

      {capsule.reply ? (
        <section className="reply">
          <h3 className="reply__label">{t("capsule.yourReply")}</h3>
          <p className="reply__body">{capsule.reply.content}</p>
          <p className="note__meta">
            {t("capsule.repliedOn", { date: formatDateTime(locale, capsule.reply.createdAt) })}
          </p>
        </section>
      ) : (
        <form
          className="reply form"
          onSubmit={(e) => {
            e.preventDefault();
            saveReply();
          }}
        >
          <div className="field">
            <label className="field-label" htmlFor={replyId}>
              {t("capsule.replyLabel")}
            </label>
            <textarea
              id={replyId}
              className="text-input text-input--area"
              rows={4}
              maxLength={REPLY_MAX}
              value={reply}
              placeholder={t("capsule.replyPlaceholder")}
              onChange={(e) => setReply(e.target.value)}
              aria-invalid={replyError !== null}
            />
            {replyError && (
              <span className="field-support field-support--error" role="alert">
                {replyError}
              </span>
            )}
          </div>
          <button type="submit" className="btn btn--filled">
            {t("capsule.saveReply")}
          </button>
        </form>
      )}
    </>
  );
}
