"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, FileText, Globe2, Image, LoaderCircle, MapPin, MessageSquare, Phone, RefreshCw, Search, ShieldAlert, ShieldCheck, ShoppingBag, SlidersHorizontal, Trash2, UserRound, X } from "lucide-react";
import { chuskyApi, type CallCapability, type CallConnectedAccount, type CallDisclosure, type CallInboundRoute, type CallMode, type CallNumberCapabilities, type CallNumberCountry, type CallNumberPrice, type CallPersona, type CallPersonaId, type CallPhoneNumber, type CallPhoneNumberOption, type CallProfile, type CallReadiness, type CallRecord, type CallTone, type Task } from "@/lib/chusky-api";
import { useLiveData } from "@/lib/live-sync";
import { Button, Card, PageHeading, Status } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";
import { ProviderVoiceSettings } from "./provider-voice-settings";
import { CallActivityTabs } from "./call-activity-tabs";
import { resolveProviderBrand } from "./trigger-logo";
import { ToolkitLogo } from "./toolkit-logo";
import { VoiceCompliancePanel } from "./voice-compliance-panel";

type CallsSection = "numbers" | "representative" | "activity" | "compliance";
type NumberFeature = "voice" | "sms" | "mms" | "emergency" | "fax" | "local_calling" | "international_sms";
type NumberSearchBy = "area_code" | "region" | "locality" | "postal_code" | "contains";

const numberFeatureOptions: Array<{ id: NumberFeature; label: string; description: string; available: boolean; icon: typeof Phone }> = [
  { id: "voice", label: "Voice", description: "Inbound and outbound calls", available: true, icon: Phone },
  { id: "sms", label: "SMS", description: "Text messaging", available: true, icon: MessageSquare },
  { id: "mms", label: "MMS", description: "Picture messaging", available: true, icon: Image },
  { id: "emergency", label: "Emergency", description: "Emergency calling", available: false, icon: ShieldAlert },
  { id: "fax", label: "Fax", description: "Faxing", available: false, icon: FileText },
  { id: "local_calling", label: "Local calling", description: "Local voice number", available: true, icon: MapPin },
  { id: "international_sms", label: "International SMS", description: "International text messaging", available: false, icon: Globe2 },
];

// Keep the common NANP area-code choices in the picker so customers can search
// by their state or city without typing an area code from memory. Twilio still
// remains the source of truth for availability; this list only controls the
// quick-select UI.
const areaCodesByCountry: Record<string, readonly string[]> = {
  US: "201 202 203 205 206 207 208 209 210 212 213 214 215 216 217 218 219 220 221 224 225 227 228 229 231 234 239 240 248 251 252 253 254 256 257 260 262 267 270 272 274 276 279 281 283 301 302 303 304 305 307 308 309 310 312 313 314 315 316 317 318 319 320 321 323 325 326 327 330 331 332 334 336 337 339 341 346 347 350 351 352 360 361 363 364 369 380 385 386 401 404 405 406 407 408 409 410 412 413 414 415 417 419 423 424 425 430 432 434 435 436 440 442 443 445 447 448 458 463 464 469 470 472 475 478 479 480 484 501 502 503 504 505 507 508 509 510 512 513 515 516 517 518 520 521 522 523 524 525 526 527 528 529 530 531 534 539 540 541 542 543 544 545 546 547 548 549 551 557 559 561 562 563 564 567 570 571 572 573 574 575 580 582 584 585 586 601 602 603 605 606 607 608 609 610 612 614 615 616 617 618 619 620 621 622 623 624 625 626 627 628 629 630 631 636 641 646 650 651 656 657 659 660 661 662 667 669 678 681 682 689 701 702 703 704 706 707 708 712 713 714 715 716 717 718 719 720 721 724 725 726 727 728 730 731 732 734 737 738 740 743 747 754 757 760 762 763 765 769 770 771 772 773 774 775 779 781 785 786 801 802 803 804 805 806 808 810 812 813 814 815 816 817 818 820 821 822 823 825 826 828 830 831 832 835 838 839 840 843 845 847 848 850 854 856 857 858 859 860 862 863 864 865 870 872 878 901 903 904 906 907 908 909 910 912 913 914 915 917 918 919 920 925 928 929 930 931 934 936 937 938 939 940 941 943 945 947 948 949 951 952 954 956 959 970 971 972 973 975 978 979 980 984 985 986 989".split(" "),
  CA: "204 226 236 249 250 263 289 306 343 354 365 367 368 382 403 416 418 428 431 437 438 450 468 474 506 514 519 548 579 581 584 587 604 613 639 647 672 683 705 709 742 753 778 780 782 807 819 825 867 873 879 905".split(" "),
};

function date(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function normalizePhone(value: string) {
  return value.replace(/[\s().-]/g, "");
}

function splitLines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function safePreviewIdentity(value: string) {
  return /\b(?:dr\.?|doctor|nurse|rn|registered\s+nurse|physician|surgeon|pharmacist|therapist|psychologist|lawyer|attorney|accountant|licensed|ordained|human)\b/i.test(value) ? "Chusky" : value.trim() || "Chusky";
}

function profileFromRoute(route: CallInboundRoute): CallPhoneNumber {
  return { phoneNumber: route.phoneNumber, displayName: route.voiceProfile.organization || route.voiceProfile.identity, source: "external", callProfile: route.callProfile, provider: route.provider, purpose: route.purpose, updatedAt: route.updatedAt };
}

function readinessTone(status: CallReadiness["status"]): "green" | "amber" | "gray" {
  return status === "ready" ? "green" : status === "blocked" ? "amber" : "gray";
}

function readinessLabel(status: CallReadiness["status"]) {
  return status === "ready" ? "Ready for controlled activation" : status === "blocked" ? "Activation blocked" : "Verification pending";
}

function CallReadinessCard({ readiness, loading, onRefresh }: { readiness?: CallReadiness; loading: boolean; onRefresh: () => void }) {
  if (!readiness && !loading) return null;
  const unresolved = readiness?.checks.filter((check) => check.required && check.status !== "complete") ?? [];
  return <Card className="mb-4 border-foreground/15 p-4 sm:mb-5 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05]"><ShieldCheck size={16} /></span>
        <div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Voice readiness</p><h2 className="mt-1 text-sm font-medium">Production activation checklist</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Calling can be tested only as far as the verified deployment gates allow. Customer number sales stay protected until billing and regulatory checks pass.</p></div>
      </div>
      <div className="flex shrink-0 items-center gap-2"><Status tone={readiness ? readinessTone(readiness.status) : "gray"}>{readiness ? readinessLabel(readiness.status) : "Loading"}</Status><Button secondary onClick={onRefresh} disabled={loading} aria-label="Refresh voice readiness">{loading ? <LoaderCircle size={12} className="animate-spin" /> : <RefreshCw size={12} />}</Button></div>
    </div>
    {readiness && <details className="mt-4 border-t border-foreground/10 pt-3"><summary className="cursor-pointer text-[11px] font-medium">{unresolved.length ? `${unresolved.length} required check${unresolved.length === 1 ? "" : "s"} remain` : "View activation checks"}</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{readiness.checks.map((check) => <div key={check.id} className="flex items-start gap-2 border border-foreground/10 p-2.5"><span className="mt-0.5 shrink-0">{check.status === "complete" ? <CheckCircle2 size={13} className="text-emerald-600" /> : check.status === "blocked" ? <ShieldAlert size={13} className="text-amber-700" /> : <AlertTriangle size={13} className="text-muted-foreground" />}</span><div className="min-w-0"><p className="text-[11px] font-medium">{check.title}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{check.detail}</p></div></div>)}</div></details>}
  </Card>;
}

export function CallsPage() {
  const [section, setSection] = useState<CallsSection>("numbers");
  const [calls, setCalls] = useState<CallRecord[]>();
  const [nextCallsCursor, setNextCallsCursor] = useState<number>();
  const [callsLoading, setCallsLoading] = useState(false);
  const [readiness, setReadiness] = useState<CallReadiness>();
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>();
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string>();
  const [inboundRoutes, setInboundRoutes] = useState<CallInboundRoute[]>([]);
  const [inboundRoutesError, setInboundRoutesError] = useState<string>();
  const [available, setAvailable] = useState(false);
  const [provider, setProvider] = useState<"twilio" | "bland" | null>(null);
  const [callAccounts, setCallAccounts] = useState<CallConnectedAccount[]>([]);
  const [callToolkits, setCallToolkits] = useState<string[]>([]);
  const [personas, setPersonas] = useState<CallPersona[]>([]);
  const [personaId, setPersonaId] = useState<CallPersonaId>();
  const [personaBusy, setPersonaBusy] = useState(false);
  const [allowedToolkits, setAllowedToolkits] = useState<string[]>([]);
  const [allowedConnectionIds, setAllowedConnectionIds] = useState<string[]>([]);
  const [allowExternalWrites, setAllowExternalWrites] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  const [continuityFromCallId, setContinuityFromCallId] = useState("");
  const [identity, setIdentity] = useState("Chusky");
  const [organization, setOrganization] = useState("");
  const [contactName, setContactName] = useState("");
  const [disclosure, setDisclosure] = useState<CallDisclosure>("assistant");
  const [mode, setMode] = useState<CallMode>("general");
  const [tone, setTone] = useState<CallTone>("professional");
  const [opening, setOpening] = useState("");
  const [facts, setFacts] = useState("");
  const [guardrails, setGuardrails] = useState("");
  const [capabilities, setCapabilities] = useState<CallCapability[]>(["memory_lookup", "scratchpad_lookup", "schedule_lookup", "task_lookup", "call_history"]);
  const [greetingMode, setGreetingMode] = useState<"dynamic" | "static" | "human_first">("dynamic");
  const [allowVoicemail, setAllowVoicemail] = useState(true);
  const [allowHumanHandoff, setAllowHumanHandoff] = useState(true);
  const [recording, setRecording] = useState<"disabled" | "announce" | "enabled">("disabled");
  const [retentionDays, setRetentionDays] = useState<1 | 7 | 30>(30);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietTimezone, setQuietTimezone] = useState("UTC");
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string>();
  const [phoneNumbers, setPhoneNumbers] = useState<CallPhoneNumber[]>([]);
  const [numberManagementAvailable, setNumberManagementAvailable] = useState(false);
  const [numberCapabilities, setNumberCapabilities] = useState<CallNumberCapabilities>({ voice: true, sms: false, mms: false, fax: false, emergency: false, localCalling: true, internationalSms: false });
  const [numberCountries, setNumberCountries] = useState<CallNumberCountry[]>([]);
  const [numberPrice, setNumberPrice] = useState<CallNumberPrice>();
  const [numberOptions, setNumberOptions] = useState<CallPhoneNumberOption[]>([]);
  const [countryCode, setCountryCode] = useState("US");
  const [numberFeatures, setNumberFeatures] = useState<NumberFeature[]>(["voice", "local_calling"]);
  const [searchBy, setSearchBy] = useState<NumberSearchBy>("area_code");
  const [areaCodes, setAreaCodes] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [locality, setLocality] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [contains, setContains] = useState("");
  const [advancedNumberSearch, setAdvancedNumberSearch] = useState(false);
  const [openNumberMenu, setOpenNumberMenu] = useState<"country" | "features" | "searchBy" | "areaCode">();
  const [numberSearchBusy, setNumberSearchBusy] = useState(false);
  const [numberPurchaseBusy, setNumberPurchaseBusy] = useState<string>();
  const [numbersError, setNumbersError] = useState<string>();

  const applyProfile = (profile?: CallProfile) => {
    if (!profile) return;
    setPersonaId(profile.personaId);
    setIdentity(profile.identity || "Chusky");
    setOrganization(profile.organization || "");
    setContactName(profile.contactName || "");
    setDisclosure(profile.disclosure ?? "assistant");
    setMode(profile.mode ?? "general");
    setTone(profile.tone ?? "professional");
    setOpening(profile.opening || "");
    setFacts(profile.facts?.join("\n") || "");
    setGuardrails(profile.guardrails?.join("\n") || "");
    setCapabilities(profile.capabilities?.length ? profile.capabilities : ["memory_lookup", "scratchpad_lookup", "schedule_lookup", "task_lookup", "call_history"]);
    setAllowedToolkits(profile.toolPolicy?.allowedToolkits ?? []);
    setAllowedConnectionIds(profile.toolPolicy?.allowedConnectionIds ?? []);
    setAllowExternalWrites(profile.toolPolicy?.allowExternalWrites ?? true);
    const controls = profile.controls;
    if (!controls) return;
    setGreetingMode(controls.greetingMode ?? "dynamic");
    setAllowVoicemail(controls.allowVoicemail ?? true);
    setAllowHumanHandoff(controls.allowHumanHandoff ?? true);
    setRecording(controls.recording ?? "disabled");
    setRetentionDays(controls.retentionDays ?? 30);
    if (controls.quietHours) {
      setQuietHoursEnabled(true);
      setQuietTimezone(controls.quietHours.timezone || "UTC");
      setQuietStart(controls.quietHours.start || "22:00");
      setQuietEnd(controls.quietHours.end || "07:00");
    } else {
      setQuietHoursEnabled(false);
    }
  };

  const loadPersonas = async () => {
    try {
      const result = await chuskyApi.account.calls.personas.list();
      setPersonas(result.data);
    } catch {
      setPersonas([]);
    }
  };

  const load = async (cursor?: number) => {
    if (cursor !== undefined && callsLoading) return;
    setCallsLoading(true);
    setError(undefined);
    try {
      const result = await chuskyApi.account.calls.list(cursor);
      const loadedCalls = cursor ? [...(calls ?? []), ...result.data] : result.data;
      setCalls(loadedCalls.filter((call, index, all) => all.findIndex((candidate) => candidate.id === call.id) === index));
      setNextCallsCursor(result.nextCursor);
      setAvailable(result.available);
      setProvider(result.provider);
      try {
        const capabilitiesResult = await chuskyApi.account.calls.capabilities();
        setCallAccounts(capabilitiesResult.data);
        setCallToolkits(capabilitiesResult.toolkits);
      } catch {
        setCallAccounts([]);
        setCallToolkits([]);
      }
      const taskIds = [...new Set(loadedCalls.flatMap((call) => call.followUpTaskIds ?? []))];
      setTasksError(undefined);
      if (taskIds.length) {
        setTasksLoading(true);
        try {
          const taskResult = await chuskyApi.tasks.list();
          setTasks(taskResult.data.filter((task) => taskIds.includes(task.id)));
        } catch (cause) {
          setTasks([]);
          setTasksError(cause instanceof Error ? cause.message : "Linked follow-up tasks could not be loaded.");
        } finally {
          setTasksLoading(false);
        }
      } else {
        setTasks([]);
        setTasksLoading(false);
      }
    } catch (cause) {
      if (!cursor) setCalls([]);
      setNextCallsCursor(undefined);
      setTasks([]);
      setTasksLoading(false);
      setError(cause instanceof Error ? cause.message : "Could not load calls.");
    } finally {
      setCallsLoading(false);
    }
  };

  const loadReadiness = async () => {
    setReadinessLoading(true);
    try {
      const result = await chuskyApi.account.calls.readiness();
      setReadiness(result.data);
    } catch {
      setReadiness(undefined);
    } finally {
      setReadinessLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const result = await chuskyApi.account.calls.profile.get();
      applyProfile(result.data);
    } catch {
      // Older accounts may not have a saved profile yet; safe local defaults remain usable.
    }
  };

  const loadNumbers = async () => {
    try {
      const result = await chuskyApi.account.calls.numbers.list();
      setPhoneNumbers(result.data);
      setNumberManagementAvailable(result.available);
      setNumberCapabilities(result.capabilities ?? { voice: true, sms: false, mms: false, fax: false, emergency: false, localCalling: true, internationalSms: false });
      setNumberCountries(result.countries ?? []);
      if (result.price) setNumberPrice(result.price);
      setNumbersError(undefined);
    } catch (cause) {
      setPhoneNumbers([]);
      setNumberManagementAvailable(false);
      setNumbersError(cause instanceof Error ? cause.message : "Phone numbers could not be loaded.");
    }
  };

  const loadInboundRoutes = async () => {
    try {
      const result = await chuskyApi.account.calls.inboundRoutes();
      setInboundRoutes(result.data);
      setInboundRoutesError(undefined);
    } catch (cause) {
      setInboundRoutes([]);
      setInboundRoutesError(cause instanceof Error ? cause.message : "Connected numbers could not be loaded.");
    }
  };

  useEffect(() => {
    void load();
    void loadReadiness();
    void loadProfile();
    void loadPersonas();
    void loadNumbers();
    void loadInboundRoutes();
  }, []);
  useLiveData(() => {
    void load();
    void loadReadiness();
    void loadProfile();
    void loadPersonas();
    void loadNumbers();
    void loadInboundRoutes();
  });

  useEffect(() => {
    if (!openNumberMenu) return;
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-number-menu]")) setOpenNumberMenu(undefined);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenNumberMenu(undefined);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openNumberMenu]);

  const addAreaCode = (value: string) => {
    const normalized = value.replace(/\D/g, "").slice(0, 6);
    if (!normalized || areaCodes.includes(normalized)) return;
    if (areaCodes.length >= 5) {
      setNumbersError("Choose up to five area codes per search.");
      return;
    }
    setAreaCodes((current) => [...current, normalized]);
  };

  const removeAreaCode = (value: string) => setAreaCodes((current) => current.filter((item) => item !== value));

  const selectedCountry = numberCountries.find((country) => country.code === countryCode);
  const areaCodeOptions = areaCodesByCountry[selectedCountry?.code ?? ""] ?? [];
  const selectedAreaCodeLabel = areaCodes.length === 0 ? "Any area code" : areaCodes.length === 1 ? areaCodes[0] : `${areaCodes.length} selected`;
  const monthlyNumberPrice = numberPrice ? `$${(numberPrice.amountCents / 100).toFixed(2)} USD / month` : undefined;
  const selectedSearchLabel = ({ area_code: "Area code", region: "State or region", locality: "City", postal_code: "Postal code", contains: "Contains" } satisfies Record<NumberSearchBy, string>)[searchBy];
  const featureAvailable = (feature: NumberFeature) => {
    if (feature === "sms") return numberCapabilities.sms;
    if (feature === "mms") return numberCapabilities.mms;
    if (feature === "fax") return numberCapabilities.fax;
    if (feature === "emergency") return numberCapabilities.emergency;
    if (feature === "international_sms") return numberCapabilities.internationalSms;
    if (feature === "local_calling") return numberCapabilities.localCalling;
    return numberCapabilities.voice;
  };

  const searchNumbers = async () => {
    setNumberSearchBusy(true);
    setNumbersError(undefined);
    try {
      const requestedAreaCodes = [...new Set(areaCodes)].slice(0, 5);
      const result = await chuskyApi.account.calls.numbers.search({
        countryCode: countryCode.trim().toUpperCase(),
        features: numberFeatures.filter((feature): feature is "voice" | "sms" | "mms" | "fax" => feature === "voice" || feature === "sms" || feature === "mms" || feature === "fax"),
        ...(searchBy === "area_code" && requestedAreaCodes.length ? { areaCodes: requestedAreaCodes } : {}),
        ...(searchBy === "region" && region.trim() ? { region: region.trim() } : {}),
        ...(searchBy === "locality" && locality.trim() ? { locality: locality.trim() } : {}),
        ...(searchBy === "postal_code" && postalCode.trim() ? { postalCode: postalCode.trim() } : {}),
        ...(searchBy === "contains" && contains.trim() ? { contains: contains.trim() } : {}),
        ...(advancedNumberSearch && searchBy !== "region" && region.trim() ? { region: region.trim() } : {}),
        ...(advancedNumberSearch && searchBy !== "locality" && locality.trim() ? { locality: locality.trim() } : {}),
        ...(advancedNumberSearch && searchBy !== "postal_code" && postalCode.trim() ? { postalCode: postalCode.trim() } : {}),
        ...(advancedNumberSearch && searchBy !== "contains" && contains.trim() ? { contains: contains.trim() } : {}),
        limit: 12,
      });
      setNumberOptions(result.data);
      if (result.price) setNumberPrice(result.price);
      if (!result.data.length) setNumbersError("No matching numbers were found. Try another area code.");
    } catch (cause) {
      setNumberOptions([]);
      setNumbersError(cause instanceof Error ? cause.message : "Phone number search failed.");
    } finally {
      setNumberSearchBusy(false);
    }
  };

  const purchaseNumber = async (option: CallPhoneNumberOption) => {
    setNumberPurchaseBusy(option.phoneNumber);
    setNumbersError(undefined);
    try {
      await chuskyApi.account.calls.numbers.purchase({ phoneNumber: option.phoneNumber, countryCode, features: { voice: numberFeatures.includes("voice"), sms: numberFeatures.includes("sms"), mms: numberFeatures.includes("mms"), fax: numberFeatures.includes("fax") }, ...(option.friendlyName ? { displayName: option.friendlyName } : {}) });
      setNumberOptions((current) => current.filter((item) => item.phoneNumber !== option.phoneNumber));
      await Promise.all([loadNumbers(), loadInboundRoutes()]);
    } catch (cause) {
      setNumbersError(cause instanceof Error ? cause.message : "That number could not be purchased.");
    } finally {
      setNumberPurchaseBusy(undefined);
    }
  };

  const releaseNumber = async (number: CallPhoneNumber) => {
    if (!window.confirm(`Release ${number.phoneNumber}? Customers will no longer reach this number.`)) return;
    setNumberPurchaseBusy(number.phoneNumber);
    setNumbersError(undefined);
    try {
      await chuskyApi.account.calls.numbers.release(number.phoneNumber);
      await Promise.all([loadNumbers(), loadInboundRoutes()]);
    } catch (cause) {
      setNumbersError(cause instanceof Error ? cause.message : "That number could not be released.");
    } finally {
      setNumberPurchaseBusy(undefined);
    }
  };

  const profilePayload = (): CallProfile => ({
    ...(personaId ? { personaId, personaVersion: 1 } : {}),
    identity: identity.trim() || "Chusky",
    ...(organization.trim() ? { organization: organization.trim() } : {}),
    ...(contactName.trim() ? { contactName: contactName.trim() } : {}),
    mode,
    tone,
    disclosure,
    ...(opening.trim() ? { opening: opening.trim() } : {}),
    facts: splitLines(facts),
    guardrails: splitLines(guardrails),
    capabilities,
    toolPolicy: { enabled: true, allowedToolkits, allowedConnectionIds, allowExternalWrites, version: 1 },
    controls: { greetingMode, allowVoicemail, allowHumanHandoff, optOutEnabled: true, recording, retentionDays, ...(quietHoursEnabled ? { quietHours: { timezone: quietTimezone, start: quietStart, end: quietEnd } } : {}) },
  });

  const applyPersona = async (nextPersonaId: CallPersonaId) => {
    setPersonaBusy(true);
    setProfileMessage(undefined);
    try {
      const result = await chuskyApi.account.calls.personas.apply(nextPersonaId);
      applyProfile(result.data);
      setProfileMessage(`${personas.find((persona) => persona.id === nextPersonaId)?.name ?? "Persona"} applied. Review the details and save when ready.`);
    } catch (cause) {
      setProfileMessage(cause instanceof Error ? cause.message : "The persona could not be applied.");
    } finally {
      setPersonaBusy(false);
    }
  };

  const saveProfile = async () => {
    setProfileBusy(true);
    setProfileMessage(undefined);
    try {
      const result = await chuskyApi.account.calls.profile.update(profilePayload());
      applyProfile(result.data);
      setProfileMessage("Representative settings saved. Your managed numbers use this profile for new calls.");
    } catch (cause) {
      setProfileMessage(cause instanceof Error ? cause.message : "Representative settings could not be saved.");
    } finally {
      setProfileBusy(false);
    }
  };

  const requestCall = async () => {
    setBusy("request");
    setError(undefined);
    try {
      const validConnectionIds = allowedConnectionIds.filter((id) => {
        const account = callAccounts.find((candidate) => candidate.id === id);
        return Boolean(account && allowedToolkits.includes(account.toolkit));
      });
      const profile = profilePayload();
      await chuskyApi.account.calls.request({ phoneNumber: normalizePhone(phoneNumber.trim()), purpose: purpose.trim(), callProfile: organization.trim() ? "business" : "personal", ...(continuityFromCallId ? { continuityFromCallId } : {}), profile: { ...profile, toolPolicy: { ...profile.toolPolicy!, allowedConnectionIds: validConnectionIds } } });
      setPhoneNumber("");
      setPurpose("");
      setContinuityFromCallId("");
      await load();
      setSection("activity");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not place a call.");
    } finally {
      setBusy(undefined);
    }
  };

  const control = async (call: CallRecord, input: Parameters<typeof chuskyApi.account.calls.control>[1]) => {
    setBusy(`${call.id}:${input.action}`);
    setError(undefined);
    try {
      await chuskyApi.account.calls.control(call.id, input);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not control the call.");
    } finally {
      setBusy(undefined);
    }
  };

  const deleteTranscript = async (call: CallRecord) => {
    if (!call.transcript || !window.confirm("Delete this call transcript? The call outcome and audit timeline will remain.")) return;
    setBusy(`${call.id}:delete_transcript`);
    setError(undefined);
    try {
      await chuskyApi.account.calls.deleteTranscript(call.id);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The transcript could not be deleted.");
    } finally {
      setBusy(undefined);
    }
  };

  const loadOlderCalls = async () => {
    if (nextCallsCursor === undefined || callsLoading) return;
    await load(nextCallsCursor);
  };

  const setupRequired = error?.toLowerCase().includes("verify your web account") ?? false;
  const continuableCalls = calls?.filter((call) => call.status === "ended" && (call.outcome || call.summary)) ?? [];
  const visibleNumbers = phoneNumbers.length ? phoneNumbers : inboundRoutes.map(profileFromRoute);
  const brandedToolkits = useMemo(() => callToolkits.map((toolkit) => ({ toolkit, brand: resolveProviderBrand({ toolkitSlug: toolkit }) })), [callToolkits]);
  const brandedAccounts = useMemo(() => callAccounts.map((account) => ({ account, brand: resolveProviderBrand({ toolkitSlug: account.toolkit }) })), [callAccounts]);
  const sections: Array<{ id: CallsSection; label: string; description: string }> = [
    { id: "numbers", label: "Phone numbers", description: "Buy and manage the numbers customers call." },
    { id: "representative", label: "Representative", description: "Define how Chusky represents you or your business." },
    { id: "activity", label: "Activity", description: "Place calls and review logs, transcripts, outcomes, and tasks." },
    { id: "compliance", label: "Compliance & health", description: "Prepare emergency address, privacy, regulatory, and provider-health settings." },
  ];

  return <div data-calls-page className="min-w-0 max-w-full overflow-x-clip">
    <PageHeading eyebrow="Voice workspace" title="Calls, with you in control." description="Choose a phone number, configure your representative, and keep every call outcome in one place." action={<Button secondary onClick={() => { void load(); void loadReadiness(); void loadProfile(); void loadPersonas(); void loadNumbers(); }}><RefreshCw size={13} /> <span className="hidden sm:inline">Refresh</span></Button>} />
    {error && <Card className="mb-4 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 sm:mb-5 sm:p-4"><div className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><div><p>{error}</p>{setupRequired && <p className="mt-1.5 text-amber-900/70">Verify your web account in Settings before using voice calls.</p>}</div></div></Card>}
    <CallReadinessCard readiness={readiness} loading={readinessLoading} onRefresh={() => void loadReadiness()} />

    <nav aria-label="Calls sections" className="mb-5 grid min-w-0 grid-cols-2 overflow-hidden rounded-lg border border-foreground/10 sm:flex sm:gap-1 sm:overflow-x-auto sm:rounded-none sm:border-x-0 sm:border-b">
      {sections.map((item) => <button key={item.id} type="button" title={item.description} onClick={() => setSection(item.id)} aria-current={section === item.id ? "page" : undefined} className={`min-h-12 min-w-0 border-b-2 px-2 py-2 text-center text-[11px] font-medium leading-4 transition-colors sm:min-h-11 sm:shrink-0 sm:whitespace-nowrap sm:px-3 sm:py-3 sm:text-left ${section === item.id ? "border-foreground bg-foreground/[0.04] text-foreground" : "border-transparent text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"}`}>{item.label}</button>)}
    </nav>

    {section === "numbers" && <div className="flex flex-col space-y-4 sm:space-y-5">
      <Card className="order-2 p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Your phone numbers</p><h2 className="mt-1.5 font-display text-2xl">Ready for callers</h2><p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">Every number here is routed to your representative. Customers only see the number and the experience you configure—not the underlying voice service.</p></div><Phone size={20} className="shrink-0 text-muted-foreground" /></div>{numbersError && <p className="mt-4 border border-amber-300 bg-amber-50 p-3 text-[11px] leading-5 text-amber-950">{numbersError}</p>}{visibleNumbers.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{visibleNumbers.map((number) => <article key={number.phoneNumber} className="flex flex-col items-stretch gap-3 rounded-lg border border-foreground/10 p-3.5 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="break-all text-sm font-medium tracking-wide">{number.phoneNumber}</p><Status tone="green">Ready</Status></div><p className="mt-1.5 text-[11px] text-muted-foreground">{number.displayName || "Chusky phone number"}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{number.source === "managed" ? "Customers can call this number now." : "Connected number · routing is active."}</p><p className="mt-2 text-[10px] text-muted-foreground">Updated {date(new Date(number.updatedAt).toISOString())}</p></div>{number.source === "managed" && <Button className="w-full sm:w-fit" secondary disabled={numberPurchaseBusy === number.phoneNumber} onClick={() => void releaseNumber(number)} aria-label={`Release ${number.phoneNumber}`}>{numberPurchaseBusy === number.phoneNumber ? <LoaderCircle size={12} className="animate-spin" /> : <Trash2 size={12} />}<span>Release</span></Button>}</article>)}</div> : <div className="mt-5 border border-dashed border-foreground/15 p-5 text-xs leading-5 text-muted-foreground">You do not have a phone number yet. Find a number below to give customers a direct line to your representative.</div>}</Card>

      <Card className="relative z-20 order-1 overflow-visible p-4 sm:p-5">
        <div className="flex items-start gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.05]"><ShoppingBag size={16} /></span><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Number inventory</p><h2 className="mt-1.5 font-display text-2xl">Get a new number</h2><p className="mt-1.5 text-xs leading-5 text-muted-foreground">Choose where you want to be reachable. Chusky handles the carrier setup and connects the number to this workspace automatically.</p></div></div>
        {!numberManagementAvailable ? <div className="mt-5 border border-foreground/10 bg-foreground/[0.025] p-3.5 text-[11px] leading-5 text-muted-foreground">Number purchasing is temporarily unavailable right now. Any connected numbers remain available for calling.</div> : <>
          <div className="mt-5 overflow-visible rounded-xl border border-foreground/10 bg-background p-3 sm:p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(190px,1.1fr)_minmax(230px,1.3fr)_minmax(180px,1fr)_minmax(220px,1.2fr)] lg:items-end">
              <div className="relative" data-number-menu>
                <label className="block text-[11px] text-muted-foreground">Country <span className="font-normal italic text-foreground">Required</span></label>
                <button type="button" aria-haspopup="listbox" aria-expanded={openNumberMenu === "country"} onClick={() => setOpenNumberMenu(openNumberMenu === "country" ? undefined : "country")} className="mt-1.5 flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-foreground/25 bg-background px-3 text-left text-xs transition-colors hover:border-foreground/45 focus:outline-none focus:ring-2 focus:ring-foreground/15"><span className="min-w-0 truncate">{selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name} ${selectedCountry.callingCode}` : "Select country"}</span><ChevronDown size={14} className={openNumberMenu === "country" ? "rotate-180 transition-transform" : "transition-transform"} /></button>
                {openNumberMenu === "country" && <div role="listbox" aria-label="Country" className="absolute z-50 mt-1 max-h-80 w-full min-w-64 overflow-auto rounded-lg border border-foreground/20 bg-background p-1 shadow-xl">{numberCountries.map((country) => <button key={country.code} type="button" role="option" aria-selected={country.code === countryCode} onClick={() => { setCountryCode(country.code); setRegion(""); setAreaCodes([]); setNumberOptions([]); setOpenNumberMenu(undefined); }} className={`flex w-full items-center justify-between rounded-md px-2.5 py-2.5 text-left text-xs hover:bg-foreground/[0.06] ${country.code === countryCode ? "bg-foreground/[0.06] font-medium" : ""}`}><span>{country.flag} {country.name}</span><span className="text-muted-foreground">{country.callingCode}</span></button>)}</div>}
              </div>

              <div className="relative" data-number-menu>
                <label className="block text-[11px] text-muted-foreground">Features</label>
                <button type="button" aria-haspopup="listbox" aria-expanded={openNumberMenu === "features"} onClick={() => setOpenNumberMenu(openNumberMenu === "features" ? undefined : "features")} className="mt-1.5 flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-foreground/25 bg-background px-2.5 text-left text-xs transition-colors hover:border-foreground/45 focus:outline-none focus:ring-2 focus:ring-foreground/15"><span className="flex min-w-0 flex-wrap gap-1">{numberFeatures.map((featureId) => { const feature = numberFeatureOptions.find((item) => item.id === featureId); return feature ? <span key={feature.id} className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.08] px-2 py-1 text-[10px] font-medium"><feature.icon size={11} />{feature.label}<X size={10} className="text-muted-foreground" /></span> : null; })}</span><ChevronDown size={14} className={openNumberMenu === "features" ? "rotate-180 transition-transform" : "shrink-0 transition-transform"} /></button>
                {openNumberMenu === "features" && <div role="listbox" aria-label="Number features" className="absolute z-30 mt-1 max-h-72 w-full min-w-64 overflow-auto rounded-lg border border-foreground/20 bg-background p-1 shadow-xl">{numberFeatureOptions.map((feature) => { const selected = numberFeatures.includes(feature.id); const available = feature.available && featureAvailable(feature.id); return <button key={feature.id} type="button" role="option" aria-selected={selected} disabled={!available} onClick={() => { if (!available) return; setNumberFeatures((current) => selected ? (feature.id === "voice" ? current : current.filter((item) => item !== feature.id)) : [...current, feature.id]); }} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs ${available ? "hover:bg-foreground/[0.06]" : "cursor-not-allowed opacity-45"}`}><feature.icon size={15} className="shrink-0" /><span className="min-w-0 flex-1"><span className="block">{feature.label}</span><span className="block text-[10px] text-muted-foreground">{feature.description}{!available ? " · unavailable" : ""}</span></span>{selected && <Check size={14} />}</button>; })}</div>}
              </div>

              <div className="relative" data-number-menu>
                <label className="block text-[11px] text-muted-foreground">Search by</label>
                <button type="button" aria-haspopup="listbox" aria-expanded={openNumberMenu === "searchBy"} onClick={() => setOpenNumberMenu(openNumberMenu === "searchBy" ? undefined : "searchBy")} className="mt-1.5 flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-foreground/25 bg-background px-3 text-left text-xs transition-colors hover:border-foreground/45 focus:outline-none focus:ring-2 focus:ring-foreground/15"><span>{selectedSearchLabel}</span><ChevronDown size={14} className={openNumberMenu === "searchBy" ? "rotate-180 transition-transform" : "transition-transform"} /></button>
                {openNumberMenu === "searchBy" && <div role="listbox" aria-label="Search by" className="absolute right-0 z-30 mt-1 w-full min-w-44 rounded-lg border border-foreground/20 bg-background p-1 shadow-xl">{(["area_code", "region", "locality", "postal_code", "contains"] as NumberSearchBy[]).map((value) => <button key={value} type="button" role="option" aria-selected={searchBy === value} onClick={() => { setSearchBy(value); setNumberOptions([]); setOpenNumberMenu(undefined); }} className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs hover:bg-foreground/[0.06] ${searchBy === value ? "font-medium" : ""}`}><span>{{ area_code: "Area code", region: selectedCountry?.regionLabel ?? "State or region", locality: "City", postal_code: "Postal code", contains: "Contains" }[value]}</span>{searchBy === value && <Check size={14} />}</button>)}</div>}
              </div>

              {searchBy === "area_code" ? <div className="relative" data-number-menu>
                <label className="block text-[11px] text-muted-foreground">Area code</label>
                <button type="button" aria-haspopup="listbox" aria-expanded={openNumberMenu === "areaCode"} onClick={() => setOpenNumberMenu(openNumberMenu === "areaCode" ? undefined : "areaCode")} className="mt-1.5 flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-foreground/25 bg-background px-3 text-left text-xs transition-colors hover:border-foreground/45 focus:outline-none focus:ring-2 focus:ring-foreground/15"><span className="truncate">{selectedAreaCodeLabel}</span><ChevronDown size={14} className={openNumberMenu === "areaCode" ? "rotate-180 transition-transform" : "transition-transform"} /></button>
                {openNumberMenu === "areaCode" && <div role="listbox" aria-label="Area code" className="absolute right-0 z-50 mt-1 max-h-80 w-full min-w-64 overflow-auto rounded-lg border border-foreground/20 bg-background p-1 shadow-xl"><button type="button" role="option" aria-selected={areaCodes.length === 0} onClick={() => { setAreaCodes([]); setOpenNumberMenu(undefined); }} className="flex w-full items-center justify-between rounded-md px-2.5 py-2.5 text-left text-xs hover:bg-foreground/[0.06]">Any area code{areaCodes.length === 0 && <Check size={14} />}</button>{areaCodeOptions.length ? areaCodeOptions.map((value) => <button key={value} type="button" role="option" aria-selected={areaCodes.includes(value)} onClick={() => areaCodes.includes(value) ? removeAreaCode(value) : addAreaCode(value)} className="flex w-full items-center justify-between rounded-md px-2.5 py-2.5 text-left text-xs hover:bg-foreground/[0.06]">{value}{areaCodes.includes(value) && <Check size={14} />}</button>) : <p className="px-2.5 py-2 text-[10px] leading-4 text-muted-foreground">Area-code selection is currently available for United States and Canada numbers.</p>}</div>}
              </div> : <label className="block text-[11px] text-muted-foreground">{selectedSearchLabel}<input value={searchBy === "region" ? region : searchBy === "locality" ? locality : searchBy === "postal_code" ? postalCode : contains} onChange={(event) => { const value = event.target.value.slice(0, 80); if (searchBy === "region") setRegion(value); else if (searchBy === "locality") setLocality(value); else if (searchBy === "postal_code") setPostalCode(value); else setContains(value); }} placeholder={searchBy === "region" ? selectedCountry?.regionPlaceholder ?? "Any region" : searchBy === "locality" ? "New York" : searchBy === "postal_code" ? "10001" : "415"} className="mt-1.5 min-h-10 w-full rounded-lg border border-foreground/25 bg-background px-3 text-xs" /></label>}
            </div>

            <div className="mt-3 flex flex-col gap-3 border-t border-foreground/10 pt-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => setAdvancedNumberSearch((value) => !value)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-foreground/[0.07] px-3 text-[11px] font-medium transition-colors hover:bg-foreground/[0.12]"><SlidersHorizontal size={13} /> Advanced search <ChevronDown size={13} className={advancedNumberSearch ? "rotate-180 transition-transform" : "transition-transform"} /></button><Button className="min-h-10 px-4" disabled={numberSearchBusy || !countryCode || !numberFeatures.includes("voice")} onClick={() => void searchNumbers()}>{numberSearchBusy ? <LoaderCircle size={13} className="animate-spin" /> : <Search size={13} />} Find numbers</Button></div>
            {advancedNumberSearch && <div className="mt-3 grid gap-3 border-t border-foreground/10 pt-3 sm:grid-cols-3"><label className="block text-[11px] text-muted-foreground">{selectedCountry?.regionLabel ?? "State or region"}<input value={region} onChange={(event) => setRegion(event.target.value.slice(0, 80))} placeholder={selectedCountry?.regionPlaceholder ?? "Any region"} className="mt-1.5 min-h-9 w-full rounded-lg border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-[11px] text-muted-foreground">City<input value={locality} onChange={(event) => setLocality(event.target.value.slice(0, 80))} placeholder="New York" className="mt-1.5 min-h-9 w-full rounded-lg border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-[11px] text-muted-foreground">Postal code<input value={postalCode} onChange={(event) => setPostalCode(event.target.value.slice(0, 20))} placeholder="10001" className="mt-1.5 min-h-9 w-full rounded-lg border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-[11px] text-muted-foreground sm:col-span-3">Contains<input value={contains} onChange={(event) => setContains(event.target.value.slice(0, 20))} placeholder="A pattern in the phone number" className="mt-1.5 min-h-9 w-full rounded-lg border border-foreground/15 bg-background px-2.5 text-xs" /></label></div>}
          </div>
          <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Voice numbers are routed automatically. SMS and MMS appear when messaging is enabled for this deployment; fax and emergency calling require separate provider and regulatory setup.</p>
          {numberPrice && <p className="mt-1 text-[10px] text-muted-foreground">Prices are calculated from live provider costs and capped at <span className="font-medium text-foreground">{monthlyNumberPrice}</span>. Provider costs are handled by Chusky; your number is automatically attached to this workspace.</p>}
          {numberOptions.length > 0 && <div className="mt-4 grid gap-2 md:grid-cols-2">{numberOptions.map((option) => { const optionPrice = option.customerPriceCents !== undefined ? `$${(option.customerPriceCents / 100).toFixed(2)} USD / month` : "Price unavailable"; return <article key={option.phoneNumber} className="flex min-h-[76px] items-center justify-between gap-4 rounded-lg border border-foreground/10 p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{option.phoneNumber}</p><p className="mt-1 text-[10px] text-muted-foreground">{[option.locality, option.region, option.isoCountry].filter(Boolean).join(" · ") || "Voice capable"}</p><p className="mt-1 text-[10px] font-medium text-foreground">{optionPrice}</p></div><div className="flex shrink-0 flex-col items-end gap-1.5"><Button className="min-h-9 px-3" disabled={numberPurchaseBusy === option.phoneNumber || !numberPrice || option.customerPriceCents === undefined} onClick={() => void purchaseNumber(option)}>{numberPurchaseBusy === option.phoneNumber ? <LoaderCircle size={12} className="animate-spin" /> : <ShoppingBag size={12} />} Buy</Button></div></article>; })}</div>}
        </>}
        {inboundRoutesError && !visibleNumbers.length && <p className="mt-3 text-[10px] text-muted-foreground">{inboundRoutesError}</p>}
      </Card>
    </div>}

    {section === "representative" && <div className="space-y-4 sm:space-y-5">
      <ProviderVoiceSettings provider={provider ?? "twilio"} title="Voice" description="Choose the voice your representative uses. The service that delivers the call is managed for you." />
      <Card className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Representative profile</p><h2 className="mt-1.5 font-display text-2xl">How Chusky represents you</h2><p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">Start with a proven role, then adjust its identity, tone, tools, and safeguards. The selected profile applies to managed inbound numbers and outbound calls.</p></div><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06] text-muted-foreground"><SlidersHorizontal size={15} /></span></div><div className="mt-5 space-y-4">
        <section aria-labelledby="voice-personas-heading" className="border border-foreground/10 bg-foreground/[0.02] p-3.5 sm:p-4"><div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06]"><UserRound size={15} /></span><div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Persona library</p><h3 id="voice-personas-heading" className="mt-1 font-display text-xl">Choose how your representative works</h3><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Each persona is a safe starting point. It does not grant accounts or permissions; connected apps and approvals still control what Chusky can actually do.</p></div></div>{personas.length ? <div className="mt-4 grid gap-2 md:grid-cols-2">{personas.map((persona) => <button key={persona.id} type="button" disabled={personaBusy} onClick={() => { setPersonaId(persona.id); void applyPersona(persona.id); }} className={`group rounded-lg border p-3 text-left transition-colors ${personaId === persona.id ? "border-foreground bg-background" : "border-foreground/10 bg-background/50 hover:border-foreground/35"}`} aria-pressed={personaId === persona.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-medium">{persona.name}</span><span className="rounded-full border border-foreground/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">{persona.category}</span></div><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{persona.shortDescription}</p></div>{personaId === persona.id && <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />}</div><p className="mt-2 text-[10px] leading-4 text-muted-foreground/80">{persona.description}</p></button>)}</div> : <p className="mt-4 text-[11px] text-muted-foreground">Persona library is loading or temporarily unavailable. You can still configure a custom representative below.</p>}<p className="mt-3 text-[10px] leading-4 text-muted-foreground">Selecting a persona updates the saved profile immediately. Your name, business, contact, verified facts, connected-app restrictions, and call controls remain yours to review.</p></section>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs text-muted-foreground">Representative name<input value={identity} onChange={(event) => setIdentity(event.target.value)} maxLength={180} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-xs text-muted-foreground">Business or personal name <span className="text-muted-foreground/70">(optional)</span><input value={organization} onChange={(event) => setOrganization(event.target.value)} maxLength={180} placeholder="MedVault" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-xs text-muted-foreground">Contact name <span className="text-muted-foreground/70">(optional)</span><input value={contactName} onChange={(event) => setContactName(event.target.value)} maxLength={180} placeholder="The person Chusky is calling" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-xs text-muted-foreground">Conversation purpose<select value={mode} onChange={(event) => setMode(event.target.value as CallMode)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="general">General assistant</option><option value="sales">Sales</option><option value="onboarding">Onboarding</option><option value="support">Support</option><option value="scheduling">Scheduling</option></select></label><label className="block text-xs text-muted-foreground">Tone<select value={tone} onChange={(event) => setTone(event.target.value as CallTone)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="professional">Professional</option><option value="warm">Warm</option><option value="direct">Direct</option><option value="consultative">Consultative</option></select></label><label className="block text-xs text-muted-foreground">Disclosure<select value={disclosure} onChange={(event) => setDisclosure(event.target.value as CallDisclosure)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="assistant">Configured assistant</option><option value="explicit_ai">Say AI assistant once</option></select></label></div>
        <div className="border border-foreground/10 bg-foreground/[0.02] p-3" aria-live="polite"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Caller-facing preview</p><p className="mt-1.5 text-xs leading-5">Hello, this is {safePreviewIdentity(identity)}, {disclosure === "explicit_ai" ? "an AI assistant" : "an assistant"}{organization.trim() ? ` from ${organization.trim()}` : " calling on behalf of the person or business that asked me to reach you"}.</p><p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">The role is disclosed once, naturally. The representative does not claim to be a nurse, doctor, lawyer, accountant, or another licensed professional.</p></div>
        <label className="block text-xs text-muted-foreground">Optional opening<input value={opening} onChange={(event) => setOpening(event.target.value)} maxLength={500} placeholder="Leave empty for a natural introduction" className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-xs text-muted-foreground">Verified context, one fact per line<textarea value={facts} onChange={(event) => setFacts(event.target.value)} rows={3} className="mt-1.5 w-full border border-foreground/15 bg-background px-2.5 py-2 text-xs" /></label><label className="block text-xs text-muted-foreground">Communication guidance, one item per line<textarea value={guardrails} onChange={(event) => setGuardrails(event.target.value)} rows={3} className="mt-1.5 w-full border border-foreground/15 bg-background px-2.5 py-2 text-xs" /></label>
        <fieldset><legend className="text-xs text-muted-foreground">Read-only context Chusky may consult</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{([["memory_lookup", "Memory"], ["scratchpad_lookup", "Scratchpad"], ["schedule_lookup", "Reminders and schedules"], ["task_lookup", "Tasks"], ["call_history", "Call history"]] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={capabilities.includes(key)} onChange={(event) => setCapabilities((current) => event.target.checked ? [...new Set([...current, key])] : current.filter((item) => item !== key))} className="accent-foreground" />{label}</label>)}</div></fieldset>
        <fieldset className="border-t border-foreground/10 pt-4"><legend className="text-xs text-muted-foreground">Connected apps</legend><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Choose apps for this representative when calls need business data or an action. Leave all unchecked to let Chusky select from active connections for the caller’s purpose. Actions and schemas load only when needed.</p>{brandedToolkits.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{brandedToolkits.map(({ toolkit, brand }) => <label key={toolkit} className="flex items-center gap-2.5 rounded-md border border-foreground/10 p-2.5 text-[11px]"><input type="checkbox" checked={allowedToolkits.includes(toolkit)} onChange={(event) => setAllowedToolkits((current) => event.target.checked ? [...new Set([...current, toolkit])] : current.filter((item) => item !== toolkit))} className="accent-foreground" /><ToolkitLogo name={brand.name} logo={brand.logo} size={28} /><span className="min-w-0 flex-1"><span className="block font-medium">{brand.name}</span><span className="block text-[10px] text-muted-foreground">Connected app</span></span></label>)}</div> : <p className="mt-3 text-[11px] text-muted-foreground">No active connected apps are available. Connect an app in Apps to enable call actions.</p>}{brandedAccounts.length > 0 && allowedToolkits.length > 0 && <div className="mt-4 border-t border-foreground/10 pt-3"><p className="text-[10px] text-muted-foreground">Optional account restriction</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{brandedAccounts.filter(({ account }) => allowedToolkits.includes(account.toolkit)).map(({ account, brand }) => <label key={account.id} className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={allowedConnectionIds.includes(account.id)} onChange={(event) => setAllowedConnectionIds((current) => event.target.checked ? [...new Set([...current, account.id])] : current.filter((item) => item !== account.id))} className="accent-foreground" /><ToolkitLogo name={brand.name} logo={brand.logo} size={22} /><span>{account.alias || brand.name}</span><span className="text-muted-foreground">({account.status.toLowerCase()})</span></label>)}</div><p className="mt-2 text-[10px] text-muted-foreground">If an account is selected, Chusky pins actions to it and will not switch accounts from caller instructions.</p></div>}<label className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={allowExternalWrites} onChange={(event) => setAllowExternalWrites(event.target.checked)} className="accent-foreground" /> Allow approved actions such as bookings, messages, refunds, and updates</label></fieldset>
        <fieldset className="border-t border-foreground/10 pt-4"><legend className="text-xs text-muted-foreground">Call controls</legend><div className="mt-2 grid gap-3 sm:grid-cols-2"><label className="block text-[11px] text-muted-foreground">Greeting mode<select value={greetingMode} onChange={(event) => setGreetingMode(event.target.value as typeof greetingMode)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="dynamic">Dynamic</option><option value="static">Static</option><option value="human_first">Human first</option></select></label><label className="block text-[11px] text-muted-foreground">Transcript retention<select value={retentionDays} onChange={(event) => setRetentionDays(Number(event.target.value) as typeof retentionDays)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value={1}>One day</option><option value={7}>Seven days</option><option value={30}>Thirty days</option></select></label><label className="flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={allowVoicemail} onChange={(event) => setAllowVoicemail(event.target.checked)} className="accent-foreground" /> Allow voicemail</label><label className="flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={allowHumanHandoff} onChange={(event) => setAllowHumanHandoff(event.target.checked)} className="accent-foreground" /> Allow human handoff</label><label className="block text-[11px] text-muted-foreground">Recording<select value={recording} onChange={(event) => setRecording(event.target.value as typeof recording)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="disabled">Disabled</option><option value="announce">Announce recording</option><option value="enabled">Enabled</option></select></label></div><label className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={quietHoursEnabled} onChange={(event) => setQuietHoursEnabled(event.target.checked)} className="accent-foreground" /> Enforce outbound quiet hours</label>{quietHoursEnabled && <div className="mt-2 grid gap-3 sm:grid-cols-3"><label className="block text-[11px] text-muted-foreground">Timezone<input value={quietTimezone} onChange={(event) => setQuietTimezone(event.target.value)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-[11px] text-muted-foreground">From<input type="time" value={quietStart} onChange={(event) => setQuietStart(event.target.value)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-[11px] text-muted-foreground">Until<input type="time" value={quietEnd} onChange={(event) => setQuietEnd(event.target.value)} className="mt-1.5 min-h-9 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label></div>}</fieldset>
        <div className="flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-4"><Button disabled={profileBusy} onClick={() => void saveProfile()}>{profileBusy ? <LoaderCircle size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Save representative</Button>{profileMessage && <p role="status" className="text-[11px] text-muted-foreground">{profileMessage}</p>}</div>
      </div></Card>
    </div>}

    {section === "activity" && <div className="space-y-4 sm:space-y-5"><div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] sm:gap-5"><Card className="p-4 sm:p-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Outbound call</p><h2 className="mt-1.5 font-display text-2xl">Place a call</h2><p className="mt-1.5 text-xs leading-5 text-muted-foreground">Enter the destination and purpose. Chusky uses the saved representative and connected-app policy.</p><div className="mt-5 space-y-3"><label className="block text-xs font-medium">Phone number<input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+1 555 010 0123" inputMode="tel" maxLength={24} className="mt-1.5 min-h-10 w-full border border-foreground/15 bg-background px-2.5 text-xs" /></label><label className="block text-xs font-medium">Purpose<textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Confirm tomorrow's appointment" maxLength={1000} rows={3} className="mt-1.5 w-full resize-none border border-foreground/15 bg-background px-2.5 py-2 text-xs leading-5" /></label>{continuableCalls.length > 0 && <label className="block text-xs text-muted-foreground">Continue from a completed call<select value={continuityFromCallId} onChange={(event) => setContinuityFromCallId(event.target.value)} className="mt-1.5 min-h-10 w-full border border-foreground/15 bg-background px-2.5 text-xs"><option value="">Start fresh</option>{continuableCalls.map((call) => <option key={call.id} value={call.id}>{call.purpose} · {date(call.updatedAt)}</option>)}</select></label>}<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"><Button className="w-full sm:w-fit" disabled={!available || !normalizePhone(phoneNumber.trim()) || !purpose.trim() || Boolean(busy)} onClick={() => setConfirm(true)}>{busy === "request" ? <LoaderCircle size={13} className="animate-spin" /> : <Phone size={13} />}{available ? "Place call" : "Voice unavailable"}</Button><Button className="w-full sm:w-fit" secondary onClick={() => setSection("representative")}><SlidersHorizontal size={13} /> Configure representative</Button></div></div></Card><Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Call handling</p><h2 className="mt-1.5 font-display text-2xl">Everything stays traceable</h2></div><ShieldCheck size={18} className="shrink-0 text-emerald-600" /></div><div className="mt-4 space-y-3 text-xs text-muted-foreground"><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Call state is reconciled as ringing, answered, voicemail, failed, or completed.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Deepgram transcripts and structured outcomes remain attached to the call.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Follow-up tasks, reminders, and tool receipts appear with the call.</p><p className="flex gap-2"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" /> Provider credentials and transport details stay out of the customer workflow.</p></div></Card></div><Card><div className="flex items-start justify-between gap-3 border-b border-foreground/10 p-3 sm:p-4"><div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Call activity</p><h2 className="mt-1 font-display text-xl sm:text-2xl">Logs, transcripts, outcomes, and tasks</h2><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Raw audio is not stored. Transcripts follow the retention setting and can be deleted by the workspace owner.</p></div></div>{calls === undefined ? <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" /> Loading calls…</div> : !calls.length ? <div className="p-5 text-xs leading-5 text-muted-foreground">No calls yet. Place a call above or wait for a customer to call one of your numbers.</div> : <div>{calls.map((call) => <CallActivityTabs key={call.id} call={call} tasks={tasks} tasksLoading={tasksLoading} tasksError={tasksError} busy={busy} onControl={(input) => void control(call, input)} onDeleteTranscript={() => void deleteTranscript(call)} />)}{nextCallsCursor !== undefined && <div className="border-t border-foreground/10 p-4 text-center"><Button className="w-full sm:w-fit" secondary onClick={() => void loadOlderCalls()} disabled={callsLoading || Boolean(busy)}>{callsLoading ? <LoaderCircle size={13} className="animate-spin" /> : null} Load older calls</Button></div>}</div>}</Card></div>}

    {section === "compliance" && <VoiceCompliancePanel />}

    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Place this phone call?" description={`Chusky will dial ${phoneNumber || "this number"} now about: ${purpose || "the stated purpose"}.`} confirmLabel="Place call" onConfirm={() => { setConfirm(false); return requestCall(); }} />
  </div>;
}
