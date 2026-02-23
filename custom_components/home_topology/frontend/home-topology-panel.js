/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ot = globalThis, Kt = ot.ShadowRoot && (ot.ShadyCSS === void 0 || ot.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Gt = Symbol(), ri = /* @__PURE__ */ new WeakMap();
let Mi = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== Gt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Kt && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = ri.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && ri.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const so = (n) => new Mi(typeof n == "string" ? n : n + "", void 0, Gt), se = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, o, r) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + n[r + 1], n[0]);
  return new Mi(t, n, Gt);
}, lo = (n, e) => {
  if (Kt) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), o = ot.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = t.cssText, n.appendChild(i);
  }
}, ai = Kt ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return so(t);
})(n) : n;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: co, defineProperty: ho, getOwnPropertyDescriptor: uo, getOwnPropertyNames: po, getOwnPropertySymbols: go, getPrototypeOf: fo } = Object, ae = globalThis, si = ae.trustedTypes, mo = si ? si.emptyScript : "", $t = ae.reactiveElementPolyfillSupport, Ue = (n, e) => n, Rt = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? mo : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, e) {
  let t = n;
  switch (e) {
    case Boolean:
      t = n !== null;
      break;
    case Number:
      t = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(n);
      } catch {
        t = null;
      }
  }
  return t;
} }, zi = (n, e) => !co(n, e), li = { attribute: !0, type: String, converter: Rt, reflect: !1, useDefault: !1, hasChanged: zi };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), ae.litPropertyMetadata ?? (ae.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let $e = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = li) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), o = this.getPropertyDescriptor(e, i, t);
      o !== void 0 && ho(this.prototype, e, o);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: o, set: r } = uo(this.prototype, e) ?? { get() {
      return this[t];
    }, set(a) {
      this[t] = a;
    } };
    return { get: o, set(a) {
      const l = o == null ? void 0 : o.call(this);
      r == null || r.call(this, a), this.requestUpdate(e, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? li;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Ue("elementProperties"))) return;
    const e = fo(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Ue("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Ue("properties"))) {
      const t = this.properties, i = [...po(t), ...go(t)];
      for (const o of i) this.createProperty(o, t[o]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, o] of t) this.elementProperties.set(i, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const o = this._$Eu(t, i);
      o !== void 0 && this._$Eh.set(o, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const o of i) t.unshift(ai(o));
    } else e !== void 0 && t.push(ai(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return lo(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostConnected) == null ? void 0 : i.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var i;
      return (i = t.hostDisconnected) == null ? void 0 : i.call(t);
    });
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    var r;
    const i = this.constructor.elementProperties.get(e), o = this.constructor._$Eu(e, i);
    if (o !== void 0 && i.reflect === !0) {
      const a = (((r = i.converter) == null ? void 0 : r.toAttribute) !== void 0 ? i.converter : Rt).toAttribute(t, i.type);
      this._$Em = e, a == null ? this.removeAttribute(o) : this.setAttribute(o, a), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var r, a;
    const i = this.constructor, o = i._$Eh.get(e);
    if (o !== void 0 && this._$Em !== o) {
      const l = i.getPropertyOptions(o), s = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((r = l.converter) == null ? void 0 : r.fromAttribute) !== void 0 ? l.converter : Rt;
      this._$Em = o;
      const c = s.fromAttribute(t, l.type);
      this[o] = c ?? ((a = this._$Ej) == null ? void 0 : a.get(o)) ?? c, this._$Em = null;
    }
  }
  requestUpdate(e, t, i) {
    var o;
    if (e !== void 0) {
      const r = this.constructor, a = this[e];
      if (i ?? (i = r.getPropertyOptions(e)), !((i.hasChanged ?? zi)(a, t) || i.useDefault && i.reflect && a === ((o = this._$Ej) == null ? void 0 : o.get(e)) && !this.hasAttribute(r._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: o, wrapped: r }, a) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), r !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), o === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [r, a] of this._$Ep) this[r] = a;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [r, a] of o) {
        const { wrapped: l } = a, s = this[r];
        l !== !0 || this._$AL.has(r) || s === void 0 || this.C(r, void 0, a, s);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (i = this._$EO) == null || i.forEach((o) => {
        var r;
        return (r = o.hostUpdate) == null ? void 0 : r.call(o);
      }), this.update(t)) : this._$EM();
    } catch (o) {
      throw e = !1, this._$EM(), o;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((i) => {
      var o;
      return (o = i.hostUpdated) == null ? void 0 : o.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
$e.elementStyles = [], $e.shadowRootOptions = { mode: "open" }, $e[Ue("elementProperties")] = /* @__PURE__ */ new Map(), $e[Ue("finalized")] = /* @__PURE__ */ new Map(), $t == null || $t({ ReactiveElement: $e }), (ae.reactiveElementVersions ?? (ae.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const He = globalThis, dt = He.trustedTypes, ci = dt ? dt.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Ui = "$lit$", oe = `lit$${Math.random().toFixed(9).slice(2)}$`, Hi = "?" + oe, _o = `<${Hi}>`, ve = document, Ve = () => ve.createComment(""), Ye = (n) => n === null || typeof n != "object" && typeof n != "function", Qt = Array.isArray, vo = (n) => Qt(n) || typeof (n == null ? void 0 : n[Symbol.iterator]) == "function", St = `[ 	
\f\r]`, Ne = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, di = /-->/g, hi = />/g, he = RegExp(`>|${St}(?:([^\\s"'>=/]+)(${St}*=${St}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ui = /'/g, pi = /"/g, Bi = /^(?:script|style|textarea|title)$/i, bo = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), u = bo(1), be = Symbol.for("lit-noChange"), k = Symbol.for("lit-nothing"), gi = /* @__PURE__ */ new WeakMap(), me = ve.createTreeWalker(ve, 129);
function Wi(n, e) {
  if (!Qt(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ci !== void 0 ? ci.createHTML(e) : e;
}
const yo = (n, e) => {
  const t = n.length - 1, i = [];
  let o, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = Ne;
  for (let l = 0; l < t; l++) {
    const s = n[l];
    let c, d, h = -1, f = 0;
    for (; f < s.length && (a.lastIndex = f, d = a.exec(s), d !== null); ) f = a.lastIndex, a === Ne ? d[1] === "!--" ? a = di : d[1] !== void 0 ? a = hi : d[2] !== void 0 ? (Bi.test(d[2]) && (o = RegExp("</" + d[2], "g")), a = he) : d[3] !== void 0 && (a = he) : a === he ? d[0] === ">" ? (a = o ?? Ne, h = -1) : d[1] === void 0 ? h = -2 : (h = a.lastIndex - d[2].length, c = d[1], a = d[3] === void 0 ? he : d[3] === '"' ? pi : ui) : a === pi || a === ui ? a = he : a === di || a === hi ? a = Ne : (a = he, o = void 0);
    const m = a === he && n[l + 1].startsWith("/>") ? " " : "";
    r += a === Ne ? s + _o : h >= 0 ? (i.push(c), s.slice(0, h) + Ui + s.slice(h) + oe + m) : s + oe + (h === -2 ? l : m);
  }
  return [Wi(n, r + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class Ke {
  constructor({ strings: e, _$litType$: t }, i) {
    let o;
    this.parts = [];
    let r = 0, a = 0;
    const l = e.length - 1, s = this.parts, [c, d] = yo(e, t);
    if (this.el = Ke.createElement(c, i), me.currentNode = this.el.content, t === 2 || t === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (o = me.nextNode()) !== null && s.length < l; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const h of o.getAttributeNames()) if (h.endsWith(Ui)) {
          const f = d[a++], m = o.getAttribute(h).split(oe), g = /([.?@])?(.*)/.exec(f);
          s.push({ type: 1, index: r, name: g[2], strings: m, ctor: g[1] === "." ? xo : g[1] === "?" ? $o : g[1] === "@" ? So : wt }), o.removeAttribute(h);
        } else h.startsWith(oe) && (s.push({ type: 6, index: r }), o.removeAttribute(h));
        if (Bi.test(o.tagName)) {
          const h = o.textContent.split(oe), f = h.length - 1;
          if (f > 0) {
            o.textContent = dt ? dt.emptyScript : "";
            for (let m = 0; m < f; m++) o.append(h[m], Ve()), me.nextNode(), s.push({ type: 2, index: ++r });
            o.append(h[f], Ve());
          }
        }
      } else if (o.nodeType === 8) if (o.data === Hi) s.push({ type: 2, index: r });
      else {
        let h = -1;
        for (; (h = o.data.indexOf(oe, h + 1)) !== -1; ) s.push({ type: 7, index: r }), h += oe.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const i = ve.createElement("template");
    return i.innerHTML = e, i;
  }
}
function De(n, e, t = n, i) {
  var a, l;
  if (e === be) return e;
  let o = i !== void 0 ? (a = t._$Co) == null ? void 0 : a[i] : t._$Cl;
  const r = Ye(e) ? void 0 : e._$litDirective$;
  return (o == null ? void 0 : o.constructor) !== r && ((l = o == null ? void 0 : o._$AO) == null || l.call(o, !1), r === void 0 ? o = void 0 : (o = new r(n), o._$AT(n, t, i)), i !== void 0 ? (t._$Co ?? (t._$Co = []))[i] = o : t._$Cl = o), o !== void 0 && (e = De(n, o._$AS(n, e.values), o, i)), e;
}
let wo = class {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: i } = this._$AD, o = ((e == null ? void 0 : e.creationScope) ?? ve).importNode(t, !0);
    me.currentNode = o;
    let r = me.nextNode(), a = 0, l = 0, s = i[0];
    for (; s !== void 0; ) {
      if (a === s.index) {
        let c;
        s.type === 2 ? c = new Te(r, r.nextSibling, this, e) : s.type === 1 ? c = new s.ctor(r, s.name, s.strings, this, e) : s.type === 6 && (c = new Eo(r, this, e)), this._$AV.push(c), s = i[++l];
      }
      a !== (s == null ? void 0 : s.index) && (r = me.nextNode(), a++);
    }
    return me.currentNode = ve, o;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
};
class Te {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, i, o) {
    this.type = 2, this._$AH = k, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = o, this._$Cv = (o == null ? void 0 : o.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = De(this, e, t), Ye(e) ? e === k || e == null || e === "" ? (this._$AH !== k && this._$AR(), this._$AH = k) : e !== this._$AH && e !== be && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : vo(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== k && Ye(this._$AH) ? this._$AA.nextSibling.data = e : this.T(ve.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var r;
    const { values: t, _$litType$: i } = e, o = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = Ke.createElement(Wi(i.h, i.h[0]), this.options)), i);
    if (((r = this._$AH) == null ? void 0 : r._$AD) === o) this._$AH.p(t);
    else {
      const a = new wo(o, this), l = a.u(this.options);
      a.p(t), this.T(l), this._$AH = a;
    }
  }
  _$AC(e) {
    let t = gi.get(e.strings);
    return t === void 0 && gi.set(e.strings, t = new Ke(e)), t;
  }
  k(e) {
    Qt(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, o = 0;
    for (const r of e) o === t.length ? t.push(i = new Te(this.O(Ve()), this.O(Ve()), this, this.options)) : i = t[o], i._$AI(r), o++;
    o < t.length && (this._$AR(i && i._$AB.nextSibling, o), t.length = o);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, t); e !== this._$AB; ) {
      const o = e.nextSibling;
      e.remove(), e = o;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class wt {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, o, r) {
    this.type = 1, this._$AH = k, this._$AN = void 0, this.element = e, this.name = t, this._$AM = o, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = k;
  }
  _$AI(e, t = this, i, o) {
    const r = this.strings;
    let a = !1;
    if (r === void 0) e = De(this, e, t, 0), a = !Ye(e) || e !== this._$AH && e !== be, a && (this._$AH = e);
    else {
      const l = e;
      let s, c;
      for (e = r[0], s = 0; s < r.length - 1; s++) c = De(this, l[i + s], t, s), c === be && (c = this._$AH[s]), a || (a = !Ye(c) || c !== this._$AH[s]), c === k ? e = k : e !== k && (e += (c ?? "") + r[s + 1]), this._$AH[s] = c;
    }
    a && !o && this.j(e);
  }
  j(e) {
    e === k ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class xo extends wt {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === k ? void 0 : e;
  }
}
class $o extends wt {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== k);
  }
}
class So extends wt {
  constructor(e, t, i, o, r) {
    super(e, t, i, o, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = De(this, e, t, 0) ?? k) === be) return;
    const i = this._$AH, o = e === k && i !== k || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== k && (i === k || o);
    o && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Eo {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    De(this, e);
  }
}
const Ao = { I: Te }, Et = He.litHtmlPolyfillSupport;
Et == null || Et(Ke, Te), (He.litHtmlVersions ?? (He.litHtmlVersions = [])).push("3.3.1");
const Do = (n, e, t) => {
  const i = (t == null ? void 0 : t.renderBefore) ?? e;
  let o = i._$litPart$;
  if (o === void 0) {
    const r = (t == null ? void 0 : t.renderBefore) ?? null;
    i._$litPart$ = o = new Te(e.insertBefore(Ve(), r), r, void 0, t ?? {});
  }
  return o._$AI(n), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const _e = globalThis;
let X = class extends $e {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Do(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return be;
  }
};
var Di;
X._$litElement$ = !0, X.finalized = !0, (Di = _e.litElementHydrateSupport) == null || Di.call(_e, { LitElement: X });
const At = _e.litElementPolyfillSupport;
At == null || At({ LitElement: X });
(_e.litElementVersions ?? (_e.litElementVersions = [])).push("4.2.1");
const ye = se`
  :host {
    /* HA theme variables with fallbacks */
    --primary-color: var(--primary-color, #03a9f4);
    --primary-text-color: var(--primary-text-color, #212121);
    --secondary-text-color: var(--secondary-text-color, #757575);
    --divider-color: var(--divider-color, #e0e0e0);
    --card-background-color: var(--card-background-color, #ffffff);
    --secondary-background-color: var(--secondary-background-color, #f5f5f5);
    --disabled-text-color: var(--disabled-text-color, #9e9e9e);
    --success-color: var(--success-color, #4caf50);
    --error-color: var(--error-color, #f44336);
    --warning-color: var(--warning-color, #ff9800);

    /* Aliases for compatibility */
    --text-primary-color: var(--primary-text-color, #212121);
    --text-secondary-color: var(--secondary-text-color, #757575);
    --disabled-color: var(--disabled-text-color, #9e9e9e);

    /* RGB variants for rgba() usage */
    --rgb-primary-color: 3, 169, 244;
    --rgb-error-color: 244, 67, 54;
    --rgb-warning-color: 255, 152, 0;
    --rgb-success-color: 76, 175, 80;

    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;

    --border-radius: 4px;
    --transition-speed: 0.2s;
  }

  * {
    box-sizing: border-box;
  }

  .card {
    background: var(--card-background-color);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: var(--spacing-md);
  }

  .section-header {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--secondary-text-color);
    margin: var(--spacing-lg) 0 var(--spacing-sm);
    letter-spacing: 0.5px;
  }

  .divider {
    height: 1px;
    background: var(--divider-color);
    margin: var(--spacing-md) 0;
  }

  .button {
    padding: var(--spacing-sm) var(--spacing-md);
    border: none;
    border-radius: var(--border-radius);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-speed);
  }

  .button-primary {
    background: var(--primary-color, #03a9f4);
    color: white !important;
    border: none;
  }

  .button-primary:hover {
    opacity: 0.9;
  }

  .button-secondary {
    background: transparent;
    color: var(--primary-color, #03a9f4) !important;
    border: 1px solid var(--divider-color, #e0e0e0);
  }

  .button-secondary:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  [data-theme="dark"] .button-secondary:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .icon-button {
    padding: var(--spacing-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-secondary-color);
    border-radius: var(--border-radius);
    transition: all var(--transition-speed);
  }

  .icon-button:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary-color);
  }

  .text-muted {
    color: var(--text-secondary-color);
    font-size: 12px;
  }

  .error-text {
    color: var(--error-color);
    font-size: 12px;
    margin-top: var(--spacing-xs);
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary-color);
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary-color);
  }

  .empty-state-icon {
    --mdc-icon-size: 48px;
    font-size: 48px;
    opacity: 0.3;
    margin-bottom: var(--spacing-md);
  }
`;
function Y(n) {
  var t, i;
  return ((i = (t = n.modules) == null ? void 0 : t._meta) == null ? void 0 : i.type) ?? "area";
}
function qi(n) {
  return n === "floor" ? ["root"] : ["root", "floor", "area"];
}
function Co(n, e) {
  return qi(n).includes(e);
}
function To(n) {
  const { locations: e, locationId: t, newParentId: i } = n;
  if (i === t || i && nt(e, t, i)) return !1;
  const o = new Map(e.map((s) => [s.id, s])), r = o.get(t);
  if (!r) return !1;
  const a = Y(r);
  if (a === "floor") {
    const s = e.find((c) => c.is_explicit_root);
    return s ? i === s.id : i === null;
  }
  const l = i === null ? "root" : Y(o.get(i) ?? {});
  return Co(a, l);
}
function nt(n, e, t) {
  if (e === t) return !1;
  const i = new Map(n.map((a) => [a.id, a]));
  let o = i.get(t);
  const r = /* @__PURE__ */ new Set();
  for (; o != null && o.parent_id; ) {
    if (o.parent_id === e || r.has(o.parent_id)) return !0;
    r.add(o.parent_id), o = i.get(o.parent_id);
  }
  return !1;
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ko = { CHILD: 2 }, Io = (n) => (...e) => ({ _$litDirective$: n, values: e });
class Oo {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, t, i) {
    this._$Ct = e, this._$AM = t, this._$Ci = i;
  }
  _$AS(e, t) {
    return this.update(e, t);
  }
  update(e, t) {
    return this.render(...t);
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: Lo } = Ao, fi = () => document.createComment(""), Fe = (n, e, t) => {
  var r;
  const i = n._$AA.parentNode, o = e === void 0 ? n._$AB : e._$AA;
  if (t === void 0) {
    const a = i.insertBefore(fi(), o), l = i.insertBefore(fi(), o);
    t = new Lo(a, l, n, n.options);
  } else {
    const a = t._$AB.nextSibling, l = t._$AM, s = l !== n;
    if (s) {
      let c;
      (r = t._$AQ) == null || r.call(t, n), t._$AM = n, t._$AP !== void 0 && (c = n._$AU) !== l._$AU && t._$AP(c);
    }
    if (a !== o || s) {
      let c = t._$AA;
      for (; c !== a; ) {
        const d = c.nextSibling;
        i.insertBefore(c, o), c = d;
      }
    }
  }
  return t;
}, ue = (n, e, t = n) => (n._$AI(e, t), n), Po = {}, No = (n, e = Po) => n._$AH = e, Fo = (n) => n._$AH, Dt = (n) => {
  n._$AR(), n._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const mi = (n, e, t) => {
  const i = /* @__PURE__ */ new Map();
  for (let o = e; o <= t; o++) i.set(n[o], o);
  return i;
}, Ro = Io(class extends Oo {
  constructor(n) {
    if (super(n), n.type !== ko.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(n, e, t) {
    let i;
    t === void 0 ? t = e : e !== void 0 && (i = e);
    const o = [], r = [];
    let a = 0;
    for (const l of n) o[a] = i ? i(l, a) : a, r[a] = t(l, a), a++;
    return { values: r, keys: o };
  }
  render(n, e, t) {
    return this.dt(n, e, t).values;
  }
  update(n, [e, t, i]) {
    const o = Fo(n), { values: r, keys: a } = this.dt(e, t, i);
    if (!Array.isArray(o)) return this.ut = a, r;
    const l = this.ut ?? (this.ut = []), s = [];
    let c, d, h = 0, f = o.length - 1, m = 0, g = r.length - 1;
    for (; h <= f && m <= g; ) if (o[h] === null) h++;
    else if (o[f] === null) f--;
    else if (l[h] === a[m]) s[m] = ue(o[h], r[m]), h++, m++;
    else if (l[f] === a[g]) s[g] = ue(o[f], r[g]), f--, g--;
    else if (l[h] === a[g]) s[g] = ue(o[h], r[g]), Fe(n, s[g + 1], o[h]), h++, g--;
    else if (l[f] === a[m]) s[m] = ue(o[f], r[m]), Fe(n, o[h], o[f]), f--, m++;
    else if (c === void 0 && (c = mi(a, m, g), d = mi(l, h, f)), c.has(l[h])) if (c.has(l[f])) {
      const b = d.get(a[m]), A = b !== void 0 ? o[b] : null;
      if (A === null) {
        const L = Fe(n, o[h]);
        ue(L, r[m]), s[m] = L;
      } else s[m] = ue(A, r[m]), Fe(n, o[h], A), o[b] = null;
      m++;
    } else Dt(o[f]), f--;
    else Dt(o[h]), h++;
    for (; m <= g; ) {
      const b = Fe(n, s[g + 1]);
      ue(b, r[m]), s[m++] = b;
    }
    for (; h <= f; ) {
      const b = o[h++];
      b !== null && Dt(b);
    }
    return this.ut = a, No(n, s), be;
  }
});
/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function _i(n, e) {
  var t = Object.keys(n);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(n);
    e && (i = i.filter(function(o) {
      return Object.getOwnPropertyDescriptor(n, o).enumerable;
    })), t.push.apply(t, i);
  }
  return t;
}
function K(n) {
  for (var e = 1; e < arguments.length; e++) {
    var t = arguments[e] != null ? arguments[e] : {};
    e % 2 ? _i(Object(t), !0).forEach(function(i) {
      Mo(n, i, t[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(n, Object.getOwnPropertyDescriptors(t)) : _i(Object(t)).forEach(function(i) {
      Object.defineProperty(n, i, Object.getOwnPropertyDescriptor(t, i));
    });
  }
  return n;
}
function rt(n) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? rt = function(e) {
    return typeof e;
  } : rt = function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, rt(n);
}
function Mo(n, e, t) {
  return e in n ? Object.defineProperty(n, e, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : n[e] = t, n;
}
function Z() {
  return Z = Object.assign || function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var i in t)
        Object.prototype.hasOwnProperty.call(t, i) && (n[i] = t[i]);
    }
    return n;
  }, Z.apply(this, arguments);
}
function zo(n, e) {
  if (n == null) return {};
  var t = {}, i = Object.keys(n), o, r;
  for (r = 0; r < i.length; r++)
    o = i[r], !(e.indexOf(o) >= 0) && (t[o] = n[o]);
  return t;
}
function Uo(n, e) {
  if (n == null) return {};
  var t = zo(n, e), i, o;
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(n);
    for (o = 0; o < r.length; o++)
      i = r[o], !(e.indexOf(i) >= 0) && Object.prototype.propertyIsEnumerable.call(n, i) && (t[i] = n[i]);
  }
  return t;
}
var Ho = "1.15.6";
function Q(n) {
  if (typeof window < "u" && window.navigator)
    return !!/* @__PURE__ */ navigator.userAgent.match(n);
}
var J = Q(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i), Ge = Q(/Edge/i), vi = Q(/firefox/i), Be = Q(/safari/i) && !Q(/chrome/i) && !Q(/android/i), Zt = Q(/iP(ad|od|hone)/i), Xi = Q(/chrome/i) && Q(/android/i), ji = {
  capture: !1,
  passive: !1
};
function x(n, e, t) {
  n.addEventListener(e, t, !J && ji);
}
function w(n, e, t) {
  n.removeEventListener(e, t, !J && ji);
}
function ht(n, e) {
  if (e) {
    if (e[0] === ">" && (e = e.substring(1)), n)
      try {
        if (n.matches)
          return n.matches(e);
        if (n.msMatchesSelector)
          return n.msMatchesSelector(e);
        if (n.webkitMatchesSelector)
          return n.webkitMatchesSelector(e);
      } catch {
        return !1;
      }
    return !1;
  }
}
function Vi(n) {
  return n.host && n !== document && n.host.nodeType ? n.host : n.parentNode;
}
function q(n, e, t, i) {
  if (n) {
    t = t || document;
    do {
      if (e != null && (e[0] === ">" ? n.parentNode === t && ht(n, e) : ht(n, e)) || i && n === t)
        return n;
      if (n === t) break;
    } while (n = Vi(n));
  }
  return null;
}
var bi = /\s+/g;
function z(n, e, t) {
  if (n && e)
    if (n.classList)
      n.classList[t ? "add" : "remove"](e);
    else {
      var i = (" " + n.className + " ").replace(bi, " ").replace(" " + e + " ", " ");
      n.className = (i + (t ? " " + e : "")).replace(bi, " ");
    }
}
function _(n, e, t) {
  var i = n && n.style;
  if (i) {
    if (t === void 0)
      return document.defaultView && document.defaultView.getComputedStyle ? t = document.defaultView.getComputedStyle(n, "") : n.currentStyle && (t = n.currentStyle), e === void 0 ? t : t[e];
    !(e in i) && e.indexOf("webkit") === -1 && (e = "-webkit-" + e), i[e] = t + (typeof t == "string" ? "" : "px");
  }
}
function Ae(n, e) {
  var t = "";
  if (typeof n == "string")
    t = n;
  else
    do {
      var i = _(n, "transform");
      i && i !== "none" && (t = i + " " + t);
    } while (!e && (n = n.parentNode));
  var o = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return o && new o(t);
}
function Yi(n, e, t) {
  if (n) {
    var i = n.getElementsByTagName(e), o = 0, r = i.length;
    if (t)
      for (; o < r; o++)
        t(i[o], o);
    return i;
  }
  return [];
}
function V() {
  var n = document.scrollingElement;
  return n || document.documentElement;
}
function C(n, e, t, i, o) {
  if (!(!n.getBoundingClientRect && n !== window)) {
    var r, a, l, s, c, d, h;
    if (n !== window && n.parentNode && n !== V() ? (r = n.getBoundingClientRect(), a = r.top, l = r.left, s = r.bottom, c = r.right, d = r.height, h = r.width) : (a = 0, l = 0, s = window.innerHeight, c = window.innerWidth, d = window.innerHeight, h = window.innerWidth), (e || t) && n !== window && (o = o || n.parentNode, !J))
      do
        if (o && o.getBoundingClientRect && (_(o, "transform") !== "none" || t && _(o, "position") !== "static")) {
          var f = o.getBoundingClientRect();
          a -= f.top + parseInt(_(o, "border-top-width")), l -= f.left + parseInt(_(o, "border-left-width")), s = a + r.height, c = l + r.width;
          break;
        }
      while (o = o.parentNode);
    if (i && n !== window) {
      var m = Ae(o || n), g = m && m.a, b = m && m.d;
      m && (a /= b, l /= g, h /= g, d /= b, s = a + d, c = l + h);
    }
    return {
      top: a,
      left: l,
      bottom: s,
      right: c,
      width: h,
      height: d
    };
  }
}
function yi(n, e, t) {
  for (var i = re(n, !0), o = C(n)[e]; i; ) {
    var r = C(i)[t], a = void 0;
    if (a = o >= r, !a) return i;
    if (i === V()) break;
    i = re(i, !1);
  }
  return !1;
}
function Ce(n, e, t, i) {
  for (var o = 0, r = 0, a = n.children; r < a.length; ) {
    if (a[r].style.display !== "none" && a[r] !== v.ghost && (i || a[r] !== v.dragged) && q(a[r], t.draggable, n, !1)) {
      if (o === e)
        return a[r];
      o++;
    }
    r++;
  }
  return null;
}
function Jt(n, e) {
  for (var t = n.lastElementChild; t && (t === v.ghost || _(t, "display") === "none" || e && !ht(t, e)); )
    t = t.previousElementSibling;
  return t || null;
}
function H(n, e) {
  var t = 0;
  if (!n || !n.parentNode)
    return -1;
  for (; n = n.previousElementSibling; )
    n.nodeName.toUpperCase() !== "TEMPLATE" && n !== v.clone && (!e || ht(n, e)) && t++;
  return t;
}
function wi(n) {
  var e = 0, t = 0, i = V();
  if (n)
    do {
      var o = Ae(n), r = o.a, a = o.d;
      e += n.scrollLeft * r, t += n.scrollTop * a;
    } while (n !== i && (n = n.parentNode));
  return [e, t];
}
function Bo(n, e) {
  for (var t in n)
    if (n.hasOwnProperty(t)) {
      for (var i in e)
        if (e.hasOwnProperty(i) && e[i] === n[t][i]) return Number(t);
    }
  return -1;
}
function re(n, e) {
  if (!n || !n.getBoundingClientRect) return V();
  var t = n, i = !1;
  do
    if (t.clientWidth < t.scrollWidth || t.clientHeight < t.scrollHeight) {
      var o = _(t);
      if (t.clientWidth < t.scrollWidth && (o.overflowX == "auto" || o.overflowX == "scroll") || t.clientHeight < t.scrollHeight && (o.overflowY == "auto" || o.overflowY == "scroll")) {
        if (!t.getBoundingClientRect || t === document.body) return V();
        if (i || e) return t;
        i = !0;
      }
    }
  while (t = t.parentNode);
  return V();
}
function Wo(n, e) {
  if (n && e)
    for (var t in e)
      e.hasOwnProperty(t) && (n[t] = e[t]);
  return n;
}
function Ct(n, e) {
  return Math.round(n.top) === Math.round(e.top) && Math.round(n.left) === Math.round(e.left) && Math.round(n.height) === Math.round(e.height) && Math.round(n.width) === Math.round(e.width);
}
var We;
function Ki(n, e) {
  return function() {
    if (!We) {
      var t = arguments, i = this;
      t.length === 1 ? n.call(i, t[0]) : n.apply(i, t), We = setTimeout(function() {
        We = void 0;
      }, e);
    }
  };
}
function qo() {
  clearTimeout(We), We = void 0;
}
function Gi(n, e, t) {
  n.scrollLeft += e, n.scrollTop += t;
}
function Qi(n) {
  var e = window.Polymer, t = window.jQuery || window.Zepto;
  return e && e.dom ? e.dom(n).cloneNode(!0) : t ? t(n).clone(!0)[0] : n.cloneNode(!0);
}
function Zi(n, e, t) {
  var i = {};
  return Array.from(n.children).forEach(function(o) {
    var r, a, l, s;
    if (!(!q(o, e.draggable, n, !1) || o.animated || o === t)) {
      var c = C(o);
      i.left = Math.min((r = i.left) !== null && r !== void 0 ? r : 1 / 0, c.left), i.top = Math.min((a = i.top) !== null && a !== void 0 ? a : 1 / 0, c.top), i.right = Math.max((l = i.right) !== null && l !== void 0 ? l : -1 / 0, c.right), i.bottom = Math.max((s = i.bottom) !== null && s !== void 0 ? s : -1 / 0, c.bottom);
    }
  }), i.width = i.right - i.left, i.height = i.bottom - i.top, i.x = i.left, i.y = i.top, i;
}
var F = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
function Xo() {
  var n = [], e;
  return {
    captureAnimationState: function() {
      if (n = [], !!this.options.animation) {
        var i = [].slice.call(this.el.children);
        i.forEach(function(o) {
          if (!(_(o, "display") === "none" || o === v.ghost)) {
            n.push({
              target: o,
              rect: C(o)
            });
            var r = K({}, n[n.length - 1].rect);
            if (o.thisAnimationDuration) {
              var a = Ae(o, !0);
              a && (r.top -= a.f, r.left -= a.e);
            }
            o.fromRect = r;
          }
        });
      }
    },
    addAnimationState: function(i) {
      n.push(i);
    },
    removeAnimationState: function(i) {
      n.splice(Bo(n, {
        target: i
      }), 1);
    },
    animateAll: function(i) {
      var o = this;
      if (!this.options.animation) {
        clearTimeout(e), typeof i == "function" && i();
        return;
      }
      var r = !1, a = 0;
      n.forEach(function(l) {
        var s = 0, c = l.target, d = c.fromRect, h = C(c), f = c.prevFromRect, m = c.prevToRect, g = l.rect, b = Ae(c, !0);
        b && (h.top -= b.f, h.left -= b.e), c.toRect = h, c.thisAnimationDuration && Ct(f, h) && !Ct(d, h) && // Make sure animatingRect is on line between toRect & fromRect
        (g.top - h.top) / (g.left - h.left) === (d.top - h.top) / (d.left - h.left) && (s = Vo(g, f, m, o.options)), Ct(h, d) || (c.prevFromRect = d, c.prevToRect = h, s || (s = o.options.animation), o.animate(c, g, h, s)), s && (r = !0, a = Math.max(a, s), clearTimeout(c.animationResetTimer), c.animationResetTimer = setTimeout(function() {
          c.animationTime = 0, c.prevFromRect = null, c.fromRect = null, c.prevToRect = null, c.thisAnimationDuration = null;
        }, s), c.thisAnimationDuration = s);
      }), clearTimeout(e), r ? e = setTimeout(function() {
        typeof i == "function" && i();
      }, a) : typeof i == "function" && i(), n = [];
    },
    animate: function(i, o, r, a) {
      if (a) {
        _(i, "transition", ""), _(i, "transform", "");
        var l = Ae(this.el), s = l && l.a, c = l && l.d, d = (o.left - r.left) / (s || 1), h = (o.top - r.top) / (c || 1);
        i.animatingX = !!d, i.animatingY = !!h, _(i, "transform", "translate3d(" + d + "px," + h + "px,0)"), this.forRepaintDummy = jo(i), _(i, "transition", "transform " + a + "ms" + (this.options.easing ? " " + this.options.easing : "")), _(i, "transform", "translate3d(0,0,0)"), typeof i.animated == "number" && clearTimeout(i.animated), i.animated = setTimeout(function() {
          _(i, "transition", ""), _(i, "transform", ""), i.animated = !1, i.animatingX = !1, i.animatingY = !1;
        }, a);
      }
    }
  };
}
function jo(n) {
  return n.offsetWidth;
}
function Vo(n, e, t, i) {
  return Math.sqrt(Math.pow(e.top - n.top, 2) + Math.pow(e.left - n.left, 2)) / Math.sqrt(Math.pow(e.top - t.top, 2) + Math.pow(e.left - t.left, 2)) * i.animation;
}
var we = [], Tt = {
  initializeByDefault: !0
}, Qe = {
  mount: function(e) {
    for (var t in Tt)
      Tt.hasOwnProperty(t) && !(t in e) && (e[t] = Tt[t]);
    we.forEach(function(i) {
      if (i.pluginName === e.pluginName)
        throw "Sortable: Cannot mount plugin ".concat(e.pluginName, " more than once");
    }), we.push(e);
  },
  pluginEvent: function(e, t, i) {
    var o = this;
    this.eventCanceled = !1, i.cancel = function() {
      o.eventCanceled = !0;
    };
    var r = e + "Global";
    we.forEach(function(a) {
      t[a.pluginName] && (t[a.pluginName][r] && t[a.pluginName][r](K({
        sortable: t
      }, i)), t.options[a.pluginName] && t[a.pluginName][e] && t[a.pluginName][e](K({
        sortable: t
      }, i)));
    });
  },
  initializePlugins: function(e, t, i, o) {
    we.forEach(function(l) {
      var s = l.pluginName;
      if (!(!e.options[s] && !l.initializeByDefault)) {
        var c = new l(e, t, e.options);
        c.sortable = e, c.options = e.options, e[s] = c, Z(i, c.defaults);
      }
    });
    for (var r in e.options)
      if (e.options.hasOwnProperty(r)) {
        var a = this.modifyOption(e, r, e.options[r]);
        typeof a < "u" && (e.options[r] = a);
      }
  },
  getEventProperties: function(e, t) {
    var i = {};
    return we.forEach(function(o) {
      typeof o.eventProperties == "function" && Z(i, o.eventProperties.call(t[o.pluginName], e));
    }), i;
  },
  modifyOption: function(e, t, i) {
    var o;
    return we.forEach(function(r) {
      e[r.pluginName] && r.optionListeners && typeof r.optionListeners[t] == "function" && (o = r.optionListeners[t].call(e[r.pluginName], i));
    }), o;
  }
};
function Yo(n) {
  var e = n.sortable, t = n.rootEl, i = n.name, o = n.targetEl, r = n.cloneEl, a = n.toEl, l = n.fromEl, s = n.oldIndex, c = n.newIndex, d = n.oldDraggableIndex, h = n.newDraggableIndex, f = n.originalEvent, m = n.putSortable, g = n.extraEventProperties;
  if (e = e || t && t[F], !!e) {
    var b, A = e.options, L = "on" + i.charAt(0).toUpperCase() + i.substr(1);
    window.CustomEvent && !J && !Ge ? b = new CustomEvent(i, {
      bubbles: !0,
      cancelable: !0
    }) : (b = document.createEvent("Event"), b.initEvent(i, !0, !0)), b.to = a || t, b.from = l || t, b.item = o || t, b.clone = r, b.oldIndex = s, b.newIndex = c, b.oldDraggableIndex = d, b.newDraggableIndex = h, b.originalEvent = f, b.pullMode = m ? m.lastPutMode : void 0;
    var T = K(K({}, g), Qe.getEventProperties(i, e));
    for (var B in T)
      b[B] = T[B];
    t && t.dispatchEvent(b), A[L] && A[L].call(e, b);
  }
}
var Ko = ["evt"], N = function(e, t) {
  var i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, o = i.evt, r = Uo(i, Ko);
  Qe.pluginEvent.bind(v)(e, t, K({
    dragEl: p,
    parentEl: E,
    ghostEl: y,
    rootEl: $,
    nextEl: fe,
    lastDownEl: at,
    cloneEl: S,
    cloneHidden: ne,
    dragStarted: Re,
    putSortable: I,
    activeSortable: v.active,
    originalEvent: o,
    oldIndex: Ee,
    oldDraggableIndex: qe,
    newIndex: U,
    newDraggableIndex: ie,
    hideGhostForTarget: io,
    unhideGhostForTarget: oo,
    cloneNowHidden: function() {
      ne = !0;
    },
    cloneNowShown: function() {
      ne = !1;
    },
    dispatchSortableEvent: function(l) {
      P({
        sortable: t,
        name: l,
        originalEvent: o
      });
    }
  }, r));
};
function P(n) {
  Yo(K({
    putSortable: I,
    cloneEl: S,
    targetEl: p,
    rootEl: $,
    oldIndex: Ee,
    oldDraggableIndex: qe,
    newIndex: U,
    newDraggableIndex: ie
  }, n));
}
var p, E, y, $, fe, at, S, ne, Ee, U, qe, ie, Je, I, Se = !1, ut = !1, pt = [], pe, W, kt, It, xi, $i, Re, xe, Xe, je = !1, et = !1, st, O, Ot = [], Mt = !1, gt = [], xt = typeof document < "u", tt = Zt, Si = Ge || J ? "cssFloat" : "float", Go = xt && !Xi && !Zt && "draggable" in document.createElement("div"), Ji = function() {
  if (xt) {
    if (J)
      return !1;
    var n = document.createElement("x");
    return n.style.cssText = "pointer-events:auto", n.style.pointerEvents === "auto";
  }
}(), eo = function(e, t) {
  var i = _(e), o = parseInt(i.width) - parseInt(i.paddingLeft) - parseInt(i.paddingRight) - parseInt(i.borderLeftWidth) - parseInt(i.borderRightWidth), r = Ce(e, 0, t), a = Ce(e, 1, t), l = r && _(r), s = a && _(a), c = l && parseInt(l.marginLeft) + parseInt(l.marginRight) + C(r).width, d = s && parseInt(s.marginLeft) + parseInt(s.marginRight) + C(a).width;
  if (i.display === "flex")
    return i.flexDirection === "column" || i.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  if (i.display === "grid")
    return i.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  if (r && l.float && l.float !== "none") {
    var h = l.float === "left" ? "left" : "right";
    return a && (s.clear === "both" || s.clear === h) ? "vertical" : "horizontal";
  }
  return r && (l.display === "block" || l.display === "flex" || l.display === "table" || l.display === "grid" || c >= o && i[Si] === "none" || a && i[Si] === "none" && c + d > o) ? "vertical" : "horizontal";
}, Qo = function(e, t, i) {
  var o = i ? e.left : e.top, r = i ? e.right : e.bottom, a = i ? e.width : e.height, l = i ? t.left : t.top, s = i ? t.right : t.bottom, c = i ? t.width : t.height;
  return o === l || r === s || o + a / 2 === l + c / 2;
}, Zo = function(e, t) {
  var i;
  return pt.some(function(o) {
    var r = o[F].options.emptyInsertThreshold;
    if (!(!r || Jt(o))) {
      var a = C(o), l = e >= a.left - r && e <= a.right + r, s = t >= a.top - r && t <= a.bottom + r;
      if (l && s)
        return i = o;
    }
  }), i;
}, to = function(e) {
  function t(r, a) {
    return function(l, s, c, d) {
      var h = l.options.group.name && s.options.group.name && l.options.group.name === s.options.group.name;
      if (r == null && (a || h))
        return !0;
      if (r == null || r === !1)
        return !1;
      if (a && r === "clone")
        return r;
      if (typeof r == "function")
        return t(r(l, s, c, d), a)(l, s, c, d);
      var f = (a ? l : s).options.group.name;
      return r === !0 || typeof r == "string" && r === f || r.join && r.indexOf(f) > -1;
    };
  }
  var i = {}, o = e.group;
  (!o || rt(o) != "object") && (o = {
    name: o
  }), i.name = o.name, i.checkPull = t(o.pull, !0), i.checkPut = t(o.put), i.revertClone = o.revertClone, e.group = i;
}, io = function() {
  !Ji && y && _(y, "display", "none");
}, oo = function() {
  !Ji && y && _(y, "display", "");
};
xt && !Xi && document.addEventListener("click", function(n) {
  if (ut)
    return n.preventDefault(), n.stopPropagation && n.stopPropagation(), n.stopImmediatePropagation && n.stopImmediatePropagation(), ut = !1, !1;
}, !0);
var ge = function(e) {
  if (p) {
    e = e.touches ? e.touches[0] : e;
    var t = Zo(e.clientX, e.clientY);
    if (t) {
      var i = {};
      for (var o in e)
        e.hasOwnProperty(o) && (i[o] = e[o]);
      i.target = i.rootEl = t, i.preventDefault = void 0, i.stopPropagation = void 0, t[F]._onDragOver(i);
    }
  }
}, Jo = function(e) {
  p && p.parentNode[F]._isOutsideThisEl(e.target);
};
function v(n, e) {
  if (!(n && n.nodeType && n.nodeType === 1))
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(n));
  this.el = n, this.options = e = Z({}, e), n[F] = this;
  var t = {
    group: null,
    sort: !0,
    disabled: !1,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(n.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: !1,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: !0,
    direction: function() {
      return eo(n, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: !0,
    animation: 0,
    easing: null,
    setData: function(a, l) {
      a.setData("Text", l.textContent);
    },
    dropBubble: !1,
    dragoverBubble: !1,
    dataIdAttr: "data-id",
    delay: 0,
    delayOnTouchOnly: !1,
    touchStartThreshold: (Number.parseInt ? Number : window).parseInt(window.devicePixelRatio, 10) || 1,
    forceFallback: !1,
    fallbackClass: "sortable-fallback",
    fallbackOnBody: !1,
    fallbackTolerance: 0,
    fallbackOffset: {
      x: 0,
      y: 0
    },
    // Disabled on Safari: #1571; Enabled on Safari IOS: #2244
    supportPointer: v.supportPointer !== !1 && "PointerEvent" in window && (!Be || Zt),
    emptyInsertThreshold: 5
  };
  Qe.initializePlugins(this, n, t);
  for (var i in t)
    !(i in e) && (e[i] = t[i]);
  to(e);
  for (var o in this)
    o.charAt(0) === "_" && typeof this[o] == "function" && (this[o] = this[o].bind(this));
  this.nativeDraggable = e.forceFallback ? !1 : Go, this.nativeDraggable && (this.options.touchStartThreshold = 1), e.supportPointer ? x(n, "pointerdown", this._onTapStart) : (x(n, "mousedown", this._onTapStart), x(n, "touchstart", this._onTapStart)), this.nativeDraggable && (x(n, "dragover", this), x(n, "dragenter", this)), pt.push(this.el), e.store && e.store.get && this.sort(e.store.get(this) || []), Z(this, Xo());
}
v.prototype = /** @lends Sortable.prototype */
{
  constructor: v,
  _isOutsideThisEl: function(e) {
    !this.el.contains(e) && e !== this.el && (xe = null);
  },
  _getDirection: function(e, t) {
    return typeof this.options.direction == "function" ? this.options.direction.call(this, e, t, p) : this.options.direction;
  },
  _onTapStart: function(e) {
    if (e.cancelable) {
      var t = this, i = this.el, o = this.options, r = o.preventOnFilter, a = e.type, l = e.touches && e.touches[0] || e.pointerType && e.pointerType === "touch" && e, s = (l || e).target, c = e.target.shadowRoot && (e.path && e.path[0] || e.composedPath && e.composedPath()[0]) || s, d = o.filter;
      if (ln(i), !p && !(/mousedown|pointerdown/.test(a) && e.button !== 0 || o.disabled) && !c.isContentEditable && !(!this.nativeDraggable && Be && s && s.tagName.toUpperCase() === "SELECT") && (s = q(s, o.draggable, i, !1), !(s && s.animated) && at !== s)) {
        if (Ee = H(s), qe = H(s, o.draggable), typeof d == "function") {
          if (d.call(this, e, s, this)) {
            P({
              sortable: t,
              rootEl: c,
              name: "filter",
              targetEl: s,
              toEl: i,
              fromEl: i
            }), N("filter", t, {
              evt: e
            }), r && e.preventDefault();
            return;
          }
        } else if (d && (d = d.split(",").some(function(h) {
          if (h = q(c, h.trim(), i, !1), h)
            return P({
              sortable: t,
              rootEl: h,
              name: "filter",
              targetEl: s,
              fromEl: i,
              toEl: i
            }), N("filter", t, {
              evt: e
            }), !0;
        }), d)) {
          r && e.preventDefault();
          return;
        }
        o.handle && !q(c, o.handle, i, !1) || this._prepareDragStart(e, l, s);
      }
    }
  },
  _prepareDragStart: function(e, t, i) {
    var o = this, r = o.el, a = o.options, l = r.ownerDocument, s;
    if (i && !p && i.parentNode === r) {
      var c = C(i);
      if ($ = r, p = i, E = p.parentNode, fe = p.nextSibling, at = i, Je = a.group, v.dragged = p, pe = {
        target: p,
        clientX: (t || e).clientX,
        clientY: (t || e).clientY
      }, xi = pe.clientX - c.left, $i = pe.clientY - c.top, this._lastX = (t || e).clientX, this._lastY = (t || e).clientY, p.style["will-change"] = "all", s = function() {
        if (N("delayEnded", o, {
          evt: e
        }), v.eventCanceled) {
          o._onDrop();
          return;
        }
        o._disableDelayedDragEvents(), !vi && o.nativeDraggable && (p.draggable = !0), o._triggerDragStart(e, t), P({
          sortable: o,
          name: "choose",
          originalEvent: e
        }), z(p, a.chosenClass, !0);
      }, a.ignore.split(",").forEach(function(d) {
        Yi(p, d.trim(), Lt);
      }), x(l, "dragover", ge), x(l, "mousemove", ge), x(l, "touchmove", ge), a.supportPointer ? (x(l, "pointerup", o._onDrop), !this.nativeDraggable && x(l, "pointercancel", o._onDrop)) : (x(l, "mouseup", o._onDrop), x(l, "touchend", o._onDrop), x(l, "touchcancel", o._onDrop)), vi && this.nativeDraggable && (this.options.touchStartThreshold = 4, p.draggable = !0), N("delayStart", this, {
        evt: e
      }), a.delay && (!a.delayOnTouchOnly || t) && (!this.nativeDraggable || !(Ge || J))) {
        if (v.eventCanceled) {
          this._onDrop();
          return;
        }
        a.supportPointer ? (x(l, "pointerup", o._disableDelayedDrag), x(l, "pointercancel", o._disableDelayedDrag)) : (x(l, "mouseup", o._disableDelayedDrag), x(l, "touchend", o._disableDelayedDrag), x(l, "touchcancel", o._disableDelayedDrag)), x(l, "mousemove", o._delayedDragTouchMoveHandler), x(l, "touchmove", o._delayedDragTouchMoveHandler), a.supportPointer && x(l, "pointermove", o._delayedDragTouchMoveHandler), o._dragStartTimer = setTimeout(s, a.delay);
      } else
        s();
    }
  },
  _delayedDragTouchMoveHandler: function(e) {
    var t = e.touches ? e.touches[0] : e;
    Math.max(Math.abs(t.clientX - this._lastX), Math.abs(t.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1)) && this._disableDelayedDrag();
  },
  _disableDelayedDrag: function() {
    p && Lt(p), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function() {
    var e = this.el.ownerDocument;
    w(e, "mouseup", this._disableDelayedDrag), w(e, "touchend", this._disableDelayedDrag), w(e, "touchcancel", this._disableDelayedDrag), w(e, "pointerup", this._disableDelayedDrag), w(e, "pointercancel", this._disableDelayedDrag), w(e, "mousemove", this._delayedDragTouchMoveHandler), w(e, "touchmove", this._delayedDragTouchMoveHandler), w(e, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function(e, t) {
    t = t || e.pointerType == "touch" && e, !this.nativeDraggable || t ? this.options.supportPointer ? x(document, "pointermove", this._onTouchMove) : t ? x(document, "touchmove", this._onTouchMove) : x(document, "mousemove", this._onTouchMove) : (x(p, "dragend", this), x($, "dragstart", this._onDragStart));
    try {
      document.selection ? lt(function() {
        document.selection.empty();
      }) : window.getSelection().removeAllRanges();
    } catch {
    }
  },
  _dragStarted: function(e, t) {
    if (Se = !1, $ && p) {
      N("dragStarted", this, {
        evt: t
      }), this.nativeDraggable && x(document, "dragover", Jo);
      var i = this.options;
      !e && z(p, i.dragClass, !1), z(p, i.ghostClass, !0), v.active = this, e && this._appendGhost(), P({
        sortable: this,
        name: "start",
        originalEvent: t
      });
    } else
      this._nulling();
  },
  _emulateDragOver: function() {
    if (W) {
      this._lastX = W.clientX, this._lastY = W.clientY, io();
      for (var e = document.elementFromPoint(W.clientX, W.clientY), t = e; e && e.shadowRoot && (e = e.shadowRoot.elementFromPoint(W.clientX, W.clientY), e !== t); )
        t = e;
      if (p.parentNode[F]._isOutsideThisEl(e), t)
        do {
          if (t[F]) {
            var i = void 0;
            if (i = t[F]._onDragOver({
              clientX: W.clientX,
              clientY: W.clientY,
              target: e,
              rootEl: t
            }), i && !this.options.dragoverBubble)
              break;
          }
          e = t;
        } while (t = Vi(t));
      oo();
    }
  },
  _onTouchMove: function(e) {
    if (pe) {
      var t = this.options, i = t.fallbackTolerance, o = t.fallbackOffset, r = e.touches ? e.touches[0] : e, a = y && Ae(y, !0), l = y && a && a.a, s = y && a && a.d, c = tt && O && wi(O), d = (r.clientX - pe.clientX + o.x) / (l || 1) + (c ? c[0] - Ot[0] : 0) / (l || 1), h = (r.clientY - pe.clientY + o.y) / (s || 1) + (c ? c[1] - Ot[1] : 0) / (s || 1);
      if (!v.active && !Se) {
        if (i && Math.max(Math.abs(r.clientX - this._lastX), Math.abs(r.clientY - this._lastY)) < i)
          return;
        this._onDragStart(e, !0);
      }
      if (y) {
        a ? (a.e += d - (kt || 0), a.f += h - (It || 0)) : a = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: d,
          f: h
        };
        var f = "matrix(".concat(a.a, ",").concat(a.b, ",").concat(a.c, ",").concat(a.d, ",").concat(a.e, ",").concat(a.f, ")");
        _(y, "webkitTransform", f), _(y, "mozTransform", f), _(y, "msTransform", f), _(y, "transform", f), kt = d, It = h, W = r;
      }
      e.cancelable && e.preventDefault();
    }
  },
  _appendGhost: function() {
    if (!y) {
      var e = this.options.fallbackOnBody ? document.body : $, t = C(p, !0, tt, !0, e), i = this.options;
      if (tt) {
        for (O = e; _(O, "position") === "static" && _(O, "transform") === "none" && O !== document; )
          O = O.parentNode;
        O !== document.body && O !== document.documentElement ? (O === document && (O = V()), t.top += O.scrollTop, t.left += O.scrollLeft) : O = V(), Ot = wi(O);
      }
      y = p.cloneNode(!0), z(y, i.ghostClass, !1), z(y, i.fallbackClass, !0), z(y, i.dragClass, !0), _(y, "transition", ""), _(y, "transform", ""), _(y, "box-sizing", "border-box"), _(y, "margin", 0), _(y, "top", t.top), _(y, "left", t.left), _(y, "width", t.width), _(y, "height", t.height), _(y, "opacity", "0.8"), _(y, "position", tt ? "absolute" : "fixed"), _(y, "zIndex", "100000"), _(y, "pointerEvents", "none"), v.ghost = y, e.appendChild(y), _(y, "transform-origin", xi / parseInt(y.style.width) * 100 + "% " + $i / parseInt(y.style.height) * 100 + "%");
    }
  },
  _onDragStart: function(e, t) {
    var i = this, o = e.dataTransfer, r = i.options;
    if (N("dragStart", this, {
      evt: e
    }), v.eventCanceled) {
      this._onDrop();
      return;
    }
    N("setupClone", this), v.eventCanceled || (S = Qi(p), S.removeAttribute("id"), S.draggable = !1, S.style["will-change"] = "", this._hideClone(), z(S, this.options.chosenClass, !1), v.clone = S), i.cloneId = lt(function() {
      N("clone", i), !v.eventCanceled && (i.options.removeCloneOnHide || $.insertBefore(S, p), i._hideClone(), P({
        sortable: i,
        name: "clone"
      }));
    }), !t && z(p, r.dragClass, !0), t ? (ut = !0, i._loopId = setInterval(i._emulateDragOver, 50)) : (w(document, "mouseup", i._onDrop), w(document, "touchend", i._onDrop), w(document, "touchcancel", i._onDrop), o && (o.effectAllowed = "move", r.setData && r.setData.call(i, o, p)), x(document, "drop", i), _(p, "transform", "translateZ(0)")), Se = !0, i._dragStartId = lt(i._dragStarted.bind(i, t, e)), x(document, "selectstart", i), Re = !0, window.getSelection().removeAllRanges(), Be && _(document.body, "user-select", "none");
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function(e) {
    var t = this.el, i = e.target, o, r, a, l = this.options, s = l.group, c = v.active, d = Je === s, h = l.sort, f = I || c, m, g = this, b = !1;
    if (Mt) return;
    function A(Pe, ro) {
      N(Pe, g, K({
        evt: e,
        isOwner: d,
        axis: m ? "vertical" : "horizontal",
        revert: a,
        dragRect: o,
        targetRect: r,
        canSort: h,
        fromSortable: f,
        target: i,
        completed: T,
        onMove: function(ni, ao) {
          return it($, t, p, o, ni, C(ni), e, ao);
        },
        changed: B
      }, ro));
    }
    function L() {
      A("dragOverAnimationCapture"), g.captureAnimationState(), g !== f && f.captureAnimationState();
    }
    function T(Pe) {
      return A("dragOverCompleted", {
        insertion: Pe
      }), Pe && (d ? c._hideClone() : c._showClone(g), g !== f && (z(p, I ? I.options.ghostClass : c.options.ghostClass, !1), z(p, l.ghostClass, !0)), I !== g && g !== v.active ? I = g : g === v.active && I && (I = null), f === g && (g._ignoreWhileAnimating = i), g.animateAll(function() {
        A("dragOverAnimationComplete"), g._ignoreWhileAnimating = null;
      }), g !== f && (f.animateAll(), f._ignoreWhileAnimating = null)), (i === p && !p.animated || i === t && !i.animated) && (xe = null), !l.dragoverBubble && !e.rootEl && i !== document && (p.parentNode[F]._isOutsideThisEl(e.target), !Pe && ge(e)), !l.dragoverBubble && e.stopPropagation && e.stopPropagation(), b = !0;
    }
    function B() {
      U = H(p), ie = H(p, l.draggable), P({
        sortable: g,
        name: "change",
        toEl: t,
        newIndex: U,
        newDraggableIndex: ie,
        originalEvent: e
      });
    }
    if (e.preventDefault !== void 0 && e.cancelable && e.preventDefault(), i = q(i, l.draggable, t, !0), A("dragOver"), v.eventCanceled) return b;
    if (p.contains(e.target) || i.animated && i.animatingX && i.animatingY || g._ignoreWhileAnimating === i)
      return T(!1);
    if (ut = !1, c && !l.disabled && (d ? h || (a = E !== $) : I === this || (this.lastPutMode = Je.checkPull(this, c, p, e)) && s.checkPut(this, c, p, e))) {
      if (m = this._getDirection(e, i) === "vertical", o = C(p), A("dragOverValid"), v.eventCanceled) return b;
      if (a)
        return E = $, L(), this._hideClone(), A("revert"), v.eventCanceled || (fe ? $.insertBefore(p, fe) : $.appendChild(p)), T(!0);
      var R = Jt(t, l.draggable);
      if (!R || nn(e, m, this) && !R.animated) {
        if (R === p)
          return T(!1);
        if (R && t === e.target && (i = R), i && (r = C(i)), it($, t, p, o, i, r, e, !!i) !== !1)
          return L(), R && R.nextSibling ? t.insertBefore(p, R.nextSibling) : t.appendChild(p), E = t, B(), T(!0);
      } else if (R && on(e, m, this)) {
        var le = Ce(t, 0, l, !0);
        if (le === p)
          return T(!1);
        if (i = le, r = C(i), it($, t, p, o, i, r, e, !1) !== !1)
          return L(), t.insertBefore(p, le), E = t, B(), T(!0);
      } else if (i.parentNode === t) {
        r = C(i);
        var j = 0, ce, ke = p.parentNode !== t, M = !Qo(p.animated && p.toRect || o, i.animated && i.toRect || r, m), Ie = m ? "top" : "left", ee = yi(i, "top", "top") || yi(p, "top", "top"), Oe = ee ? ee.scrollTop : void 0;
        xe !== i && (ce = r[Ie], je = !1, et = !M && l.invertSwap || ke), j = rn(e, i, r, m, M ? 1 : l.swapThreshold, l.invertedSwapThreshold == null ? l.swapThreshold : l.invertedSwapThreshold, et, xe === i);
        var G;
        if (j !== 0) {
          var de = H(p);
          do
            de -= j, G = E.children[de];
          while (G && (_(G, "display") === "none" || G === y));
        }
        if (j === 0 || G === i)
          return T(!1);
        xe = i, Xe = j;
        var Le = i.nextElementSibling, te = !1;
        te = j === 1;
        var Ze = it($, t, p, o, i, r, e, te);
        if (Ze !== !1)
          return (Ze === 1 || Ze === -1) && (te = Ze === 1), Mt = !0, setTimeout(tn, 30), L(), te && !Le ? t.appendChild(p) : i.parentNode.insertBefore(p, te ? Le : i), ee && Gi(ee, 0, Oe - ee.scrollTop), E = p.parentNode, ce !== void 0 && !et && (st = Math.abs(ce - C(i)[Ie])), B(), T(!0);
      }
      if (t.contains(p))
        return T(!1);
    }
    return !1;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function() {
    w(document, "mousemove", this._onTouchMove), w(document, "touchmove", this._onTouchMove), w(document, "pointermove", this._onTouchMove), w(document, "dragover", ge), w(document, "mousemove", ge), w(document, "touchmove", ge);
  },
  _offUpEvents: function() {
    var e = this.el.ownerDocument;
    w(e, "mouseup", this._onDrop), w(e, "touchend", this._onDrop), w(e, "pointerup", this._onDrop), w(e, "pointercancel", this._onDrop), w(e, "touchcancel", this._onDrop), w(document, "selectstart", this);
  },
  _onDrop: function(e) {
    var t = this.el, i = this.options;
    if (U = H(p), ie = H(p, i.draggable), N("drop", this, {
      evt: e
    }), E = p && p.parentNode, U = H(p), ie = H(p, i.draggable), v.eventCanceled) {
      this._nulling();
      return;
    }
    Se = !1, et = !1, je = !1, clearInterval(this._loopId), clearTimeout(this._dragStartTimer), zt(this.cloneId), zt(this._dragStartId), this.nativeDraggable && (w(document, "drop", this), w(t, "dragstart", this._onDragStart)), this._offMoveEvents(), this._offUpEvents(), Be && _(document.body, "user-select", ""), _(p, "transform", ""), e && (Re && (e.cancelable && e.preventDefault(), !i.dropBubble && e.stopPropagation()), y && y.parentNode && y.parentNode.removeChild(y), ($ === E || I && I.lastPutMode !== "clone") && S && S.parentNode && S.parentNode.removeChild(S), p && (this.nativeDraggable && w(p, "dragend", this), Lt(p), p.style["will-change"] = "", Re && !Se && z(p, I ? I.options.ghostClass : this.options.ghostClass, !1), z(p, this.options.chosenClass, !1), P({
      sortable: this,
      name: "unchoose",
      toEl: E,
      newIndex: null,
      newDraggableIndex: null,
      originalEvent: e
    }), $ !== E ? (U >= 0 && (P({
      rootEl: E,
      name: "add",
      toEl: E,
      fromEl: $,
      originalEvent: e
    }), P({
      sortable: this,
      name: "remove",
      toEl: E,
      originalEvent: e
    }), P({
      rootEl: E,
      name: "sort",
      toEl: E,
      fromEl: $,
      originalEvent: e
    }), P({
      sortable: this,
      name: "sort",
      toEl: E,
      originalEvent: e
    })), I && I.save()) : U !== Ee && U >= 0 && (P({
      sortable: this,
      name: "update",
      toEl: E,
      originalEvent: e
    }), P({
      sortable: this,
      name: "sort",
      toEl: E,
      originalEvent: e
    })), v.active && ((U == null || U === -1) && (U = Ee, ie = qe), P({
      sortable: this,
      name: "end",
      toEl: E,
      originalEvent: e
    }), this.save()))), this._nulling();
  },
  _nulling: function() {
    N("nulling", this), $ = p = E = y = fe = S = at = ne = pe = W = Re = U = ie = Ee = qe = xe = Xe = I = Je = v.dragged = v.ghost = v.clone = v.active = null, gt.forEach(function(e) {
      e.checked = !0;
    }), gt.length = kt = It = 0;
  },
  handleEvent: function(e) {
    switch (e.type) {
      case "drop":
      case "dragend":
        this._onDrop(e);
        break;
      case "dragenter":
      case "dragover":
        p && (this._onDragOver(e), en(e));
        break;
      case "selectstart":
        e.preventDefault();
        break;
    }
  },
  /**
   * Serializes the item into an array of string.
   * @returns {String[]}
   */
  toArray: function() {
    for (var e = [], t, i = this.el.children, o = 0, r = i.length, a = this.options; o < r; o++)
      t = i[o], q(t, a.draggable, this.el, !1) && e.push(t.getAttribute(a.dataIdAttr) || sn(t));
    return e;
  },
  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function(e, t) {
    var i = {}, o = this.el;
    this.toArray().forEach(function(r, a) {
      var l = o.children[a];
      q(l, this.options.draggable, o, !1) && (i[r] = l);
    }, this), t && this.captureAnimationState(), e.forEach(function(r) {
      i[r] && (o.removeChild(i[r]), o.appendChild(i[r]));
    }), t && this.animateAll();
  },
  /**
   * Save the current sorting
   */
  save: function() {
    var e = this.options.store;
    e && e.set && e.set(this);
  },
  /**
   * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
   * @param   {HTMLElement}  el
   * @param   {String}       [selector]  default: `options.draggable`
   * @returns {HTMLElement|null}
   */
  closest: function(e, t) {
    return q(e, t || this.options.draggable, this.el, !1);
  },
  /**
   * Set/get option
   * @param   {string} name
   * @param   {*}      [value]
   * @returns {*}
   */
  option: function(e, t) {
    var i = this.options;
    if (t === void 0)
      return i[e];
    var o = Qe.modifyOption(this, e, t);
    typeof o < "u" ? i[e] = o : i[e] = t, e === "group" && to(i);
  },
  /**
   * Destroy
   */
  destroy: function() {
    N("destroy", this);
    var e = this.el;
    e[F] = null, w(e, "mousedown", this._onTapStart), w(e, "touchstart", this._onTapStart), w(e, "pointerdown", this._onTapStart), this.nativeDraggable && (w(e, "dragover", this), w(e, "dragenter", this)), Array.prototype.forEach.call(e.querySelectorAll("[draggable]"), function(t) {
      t.removeAttribute("draggable");
    }), this._onDrop(), this._disableDelayedDragEvents(), pt.splice(pt.indexOf(this.el), 1), this.el = e = null;
  },
  _hideClone: function() {
    if (!ne) {
      if (N("hideClone", this), v.eventCanceled) return;
      _(S, "display", "none"), this.options.removeCloneOnHide && S.parentNode && S.parentNode.removeChild(S), ne = !0;
    }
  },
  _showClone: function(e) {
    if (e.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (ne) {
      if (N("showClone", this), v.eventCanceled) return;
      p.parentNode == $ && !this.options.group.revertClone ? $.insertBefore(S, p) : fe ? $.insertBefore(S, fe) : $.appendChild(S), this.options.group.revertClone && this.animate(p, S), _(S, "display", ""), ne = !1;
    }
  }
};
function en(n) {
  n.dataTransfer && (n.dataTransfer.dropEffect = "move"), n.cancelable && n.preventDefault();
}
function it(n, e, t, i, o, r, a, l) {
  var s, c = n[F], d = c.options.onMove, h;
  return window.CustomEvent && !J && !Ge ? s = new CustomEvent("move", {
    bubbles: !0,
    cancelable: !0
  }) : (s = document.createEvent("Event"), s.initEvent("move", !0, !0)), s.to = e, s.from = n, s.dragged = t, s.draggedRect = i, s.related = o || e, s.relatedRect = r || C(e), s.willInsertAfter = l, s.originalEvent = a, n.dispatchEvent(s), d && (h = d.call(c, s, a)), h;
}
function Lt(n) {
  n.draggable = !1;
}
function tn() {
  Mt = !1;
}
function on(n, e, t) {
  var i = C(Ce(t.el, 0, t.options, !0)), o = Zi(t.el, t.options, y), r = 10;
  return e ? n.clientX < o.left - r || n.clientY < i.top && n.clientX < i.right : n.clientY < o.top - r || n.clientY < i.bottom && n.clientX < i.left;
}
function nn(n, e, t) {
  var i = C(Jt(t.el, t.options.draggable)), o = Zi(t.el, t.options, y), r = 10;
  return e ? n.clientX > o.right + r || n.clientY > i.bottom && n.clientX > i.left : n.clientY > o.bottom + r || n.clientX > i.right && n.clientY > i.top;
}
function rn(n, e, t, i, o, r, a, l) {
  var s = i ? n.clientY : n.clientX, c = i ? t.height : t.width, d = i ? t.top : t.left, h = i ? t.bottom : t.right, f = !1;
  if (!a) {
    if (l && st < c * o) {
      if (!je && (Xe === 1 ? s > d + c * r / 2 : s < h - c * r / 2) && (je = !0), je)
        f = !0;
      else if (Xe === 1 ? s < d + st : s > h - st)
        return -Xe;
    } else if (s > d + c * (1 - o) / 2 && s < h - c * (1 - o) / 2)
      return an(e);
  }
  return f = f || a, f && (s < d + c * r / 2 || s > h - c * r / 2) ? s > d + c / 2 ? 1 : -1 : 0;
}
function an(n) {
  return H(p) < H(n) ? 1 : -1;
}
function sn(n) {
  for (var e = n.tagName + n.className + n.src + n.href + n.textContent, t = e.length, i = 0; t--; )
    i += e.charCodeAt(t);
  return i.toString(36);
}
function ln(n) {
  gt.length = 0;
  for (var e = n.getElementsByTagName("input"), t = e.length; t--; ) {
    var i = e[t];
    i.checked && gt.push(i);
  }
}
function lt(n) {
  return setTimeout(n, 0);
}
function zt(n) {
  return clearTimeout(n);
}
xt && x(document, "touchmove", function(n) {
  (v.active || Se) && n.cancelable && n.preventDefault();
});
v.utils = {
  on: x,
  off: w,
  css: _,
  find: Yi,
  is: function(e, t) {
    return !!q(e, t, e, !1);
  },
  extend: Wo,
  throttle: Ki,
  closest: q,
  toggleClass: z,
  clone: Qi,
  index: H,
  nextTick: lt,
  cancelNextTick: zt,
  detectDirection: eo,
  getChild: Ce,
  expando: F
};
v.get = function(n) {
  return n[F];
};
v.mount = function() {
  for (var n = arguments.length, e = new Array(n), t = 0; t < n; t++)
    e[t] = arguments[t];
  e[0].constructor === Array && (e = e[0]), e.forEach(function(i) {
    if (!i.prototype || !i.prototype.constructor)
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(i));
    i.utils && (v.utils = K(K({}, v.utils), i.utils)), Qe.mount(i);
  });
};
v.create = function(n, e) {
  return new v(n, e);
};
v.version = Ho;
var D = [], Me, Ut, Ht = !1, Pt, Nt, ft, ze;
function cn() {
  function n() {
    this.defaults = {
      scroll: !0,
      forceAutoScrollFallback: !1,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: !0
    };
    for (var e in this)
      e.charAt(0) === "_" && typeof this[e] == "function" && (this[e] = this[e].bind(this));
  }
  return n.prototype = {
    dragStarted: function(t) {
      var i = t.originalEvent;
      this.sortable.nativeDraggable ? x(document, "dragover", this._handleAutoScroll) : this.options.supportPointer ? x(document, "pointermove", this._handleFallbackAutoScroll) : i.touches ? x(document, "touchmove", this._handleFallbackAutoScroll) : x(document, "mousemove", this._handleFallbackAutoScroll);
    },
    dragOverCompleted: function(t) {
      var i = t.originalEvent;
      !this.options.dragOverBubble && !i.rootEl && this._handleAutoScroll(i);
    },
    drop: function() {
      this.sortable.nativeDraggable ? w(document, "dragover", this._handleAutoScroll) : (w(document, "pointermove", this._handleFallbackAutoScroll), w(document, "touchmove", this._handleFallbackAutoScroll), w(document, "mousemove", this._handleFallbackAutoScroll)), Ei(), ct(), qo();
    },
    nulling: function() {
      ft = Ut = Me = Ht = ze = Pt = Nt = null, D.length = 0;
    },
    _handleFallbackAutoScroll: function(t) {
      this._handleAutoScroll(t, !0);
    },
    _handleAutoScroll: function(t, i) {
      var o = this, r = (t.touches ? t.touches[0] : t).clientX, a = (t.touches ? t.touches[0] : t).clientY, l = document.elementFromPoint(r, a);
      if (ft = t, i || this.options.forceAutoScrollFallback || Ge || J || Be) {
        Ft(t, this.options, l, i);
        var s = re(l, !0);
        Ht && (!ze || r !== Pt || a !== Nt) && (ze && Ei(), ze = setInterval(function() {
          var c = re(document.elementFromPoint(r, a), !0);
          c !== s && (s = c, ct()), Ft(t, o.options, c, i);
        }, 10), Pt = r, Nt = a);
      } else {
        if (!this.options.bubbleScroll || re(l, !0) === V()) {
          ct();
          return;
        }
        Ft(t, this.options, re(l, !1), !1);
      }
    }
  }, Z(n, {
    pluginName: "scroll",
    initializeByDefault: !0
  });
}
function ct() {
  D.forEach(function(n) {
    clearInterval(n.pid);
  }), D = [];
}
function Ei() {
  clearInterval(ze);
}
var Ft = Ki(function(n, e, t, i) {
  if (e.scroll) {
    var o = (n.touches ? n.touches[0] : n).clientX, r = (n.touches ? n.touches[0] : n).clientY, a = e.scrollSensitivity, l = e.scrollSpeed, s = V(), c = !1, d;
    Ut !== t && (Ut = t, ct(), Me = e.scroll, d = e.scrollFn, Me === !0 && (Me = re(t, !0)));
    var h = 0, f = Me;
    do {
      var m = f, g = C(m), b = g.top, A = g.bottom, L = g.left, T = g.right, B = g.width, R = g.height, le = void 0, j = void 0, ce = m.scrollWidth, ke = m.scrollHeight, M = _(m), Ie = m.scrollLeft, ee = m.scrollTop;
      m === s ? (le = B < ce && (M.overflowX === "auto" || M.overflowX === "scroll" || M.overflowX === "visible"), j = R < ke && (M.overflowY === "auto" || M.overflowY === "scroll" || M.overflowY === "visible")) : (le = B < ce && (M.overflowX === "auto" || M.overflowX === "scroll"), j = R < ke && (M.overflowY === "auto" || M.overflowY === "scroll"));
      var Oe = le && (Math.abs(T - o) <= a && Ie + B < ce) - (Math.abs(L - o) <= a && !!Ie), G = j && (Math.abs(A - r) <= a && ee + R < ke) - (Math.abs(b - r) <= a && !!ee);
      if (!D[h])
        for (var de = 0; de <= h; de++)
          D[de] || (D[de] = {});
      (D[h].vx != Oe || D[h].vy != G || D[h].el !== m) && (D[h].el = m, D[h].vx = Oe, D[h].vy = G, clearInterval(D[h].pid), (Oe != 0 || G != 0) && (c = !0, D[h].pid = setInterval((function() {
        i && this.layer === 0 && v.active._onTouchMove(ft);
        var Le = D[this.layer].vy ? D[this.layer].vy * l : 0, te = D[this.layer].vx ? D[this.layer].vx * l : 0;
        typeof d == "function" && d.call(v.dragged.parentNode[F], te, Le, n, ft, D[this.layer].el) !== "continue" || Gi(D[this.layer].el, te, Le);
      }).bind({
        layer: h
      }), 24))), h++;
    } while (e.bubbleScroll && f !== s && (f = re(f, !1)));
    Ht = c;
  }
}, 30), no = function(e) {
  var t = e.originalEvent, i = e.putSortable, o = e.dragEl, r = e.activeSortable, a = e.dispatchSortableEvent, l = e.hideGhostForTarget, s = e.unhideGhostForTarget;
  if (t) {
    var c = i || r;
    l();
    var d = t.changedTouches && t.changedTouches.length ? t.changedTouches[0] : t, h = document.elementFromPoint(d.clientX, d.clientY);
    s(), c && !c.el.contains(h) && (a("spill"), this.onSpill({
      dragEl: o,
      putSortable: i
    }));
  }
};
function ei() {
}
ei.prototype = {
  startIndex: null,
  dragStart: function(e) {
    var t = e.oldDraggableIndex;
    this.startIndex = t;
  },
  onSpill: function(e) {
    var t = e.dragEl, i = e.putSortable;
    this.sortable.captureAnimationState(), i && i.captureAnimationState();
    var o = Ce(this.sortable.el, this.startIndex, this.options);
    o ? this.sortable.el.insertBefore(t, o) : this.sortable.el.appendChild(t), this.sortable.animateAll(), i && i.animateAll();
  },
  drop: no
};
Z(ei, {
  pluginName: "revertOnSpill"
});
function ti() {
}
ti.prototype = {
  onSpill: function(e) {
    var t = e.dragEl, i = e.putSortable, o = i || this.sortable;
    o.captureAnimationState(), t.parentNode && t.parentNode.removeChild(t), o.animateAll();
  },
  drop: no
};
Z(ti, {
  pluginName: "removeOnSpill"
});
v.mount(new cn());
v.mount(ti, ei);
function Ai(n, e) {
  const t = /* @__PURE__ */ new Map();
  for (const r of n) {
    const a = r.parent_id;
    t.has(a) || t.set(a, []), t.get(a).push(r);
  }
  const i = [];
  function o(r, a) {
    const l = t.get(r) || [];
    for (const s of l) {
      const d = (t.get(s.id) || []).length > 0, h = e.has(s.id);
      i.push({ location: s, depth: a, hasChildren: d, isExpanded: h }), h && d && o(s.id, a + 1);
    }
  }
  return o(null, 0), i;
}
function dn(n, e) {
  const t = /* @__PURE__ */ new Set([e]);
  let i = !0;
  for (; i; ) {
    i = !1;
    for (const o of n) {
      const r = o.location.parent_id;
      r && t.has(r) && !t.has(o.location.id) && (t.add(o.location.id), i = !0);
    }
  }
  return t;
}
function hn(n, e, t, i, o, r) {
  const l = dn(n, e), s = n.filter((g) => !l.has(g.location.id));
  let c = o;
  const d = r != null && r.relatedId ? s.find((g) => g.location.id === r.relatedId) : void 0;
  d && (d.location.id === o ? c = d.location.parent_id : Y(d.location) === "floor" ? (r == null ? void 0 : r.pointerX) !== void 0 && (r == null ? void 0 : r.relatedLeft) !== void 0 && r.pointerX < r.relatedLeft + 10 ? c = d.location.parent_id : c = d.location.id : (r == null ? void 0 : r.pointerX) !== void 0 && (r == null ? void 0 : r.relatedLeft) !== void 0 && r.pointerX < r.relatedLeft + 10 ? c = d.location.parent_id : (r == null ? void 0 : r.pointerX) !== void 0 && (r == null ? void 0 : r.relatedLeft) !== void 0 && r.pointerX >= r.relatedLeft + 10 || d.isExpanded && (r != null && r.willInsertAfter) ? c = d.location.id : c = d.location.parent_id);
  const h = s.filter((g) => g.location.parent_id === c);
  if (d) {
    if (c === d.location.id)
      return { parentId: c, siblingIndex: h.length };
    const g = h.findIndex(
      (b) => b.location.id === d.location.id
    );
    if (g >= 0) {
      const b = r != null && r.willInsertAfter ? g + 1 : g;
      return { parentId: c, siblingIndex: Math.max(0, Math.min(b, h.length)) };
    }
  }
  const f = Math.max(
    0,
    Math.min(
      i > t ? i - l.size : i,
      s.length
    )
  ), m = s.slice(0, f).filter((g) => g.location.parent_id === c).length;
  return { parentId: c, siblingIndex: m };
}
const mt = class mt extends X {
  constructor() {
    super(...arguments), this.locations = [], this.version = 0, this._expandedIds = /* @__PURE__ */ new Set(), this._editingValue = "", this._isDragging = !1, this._hasInitializedExpansion = !1;
  }
  _resolveDropContextFromPointer(e, t, i) {
    var a;
    if (i === void 0) return;
    const o = Array.from(
      ((a = this.shadowRoot) == null ? void 0 : a.querySelectorAll(".tree-item[data-id]")) || []
    );
    let r;
    for (const l of o) {
      const s = l.getAttribute("data-id") || void 0;
      if (!s || s === e || nt(this.locations, e, s)) continue;
      const c = l.getBoundingClientRect(), d = c.top + c.height / 2, h = Math.abs(i - d);
      (!r || h < r.dist) && (r = { id: s, left: c.left, centerY: d, dist: h });
    }
    if (r)
      return {
        relatedId: r.id,
        relatedLeft: r.left,
        pointerX: t,
        willInsertAfter: i >= r.centerY
      };
  }
  _resolveRelatedId(e) {
    var a, l, s;
    const t = ((a = e.dragged) == null ? void 0 : a.getAttribute("data-id")) || void 0, i = e.related;
    if (!t || !(i != null && i.classList.contains("tree-item"))) return;
    const o = (l = e.originalEvent) == null ? void 0 : l.clientY;
    if (o !== void 0) {
      const c = Array.from(
        ((s = this.shadowRoot) == null ? void 0 : s.querySelectorAll(".tree-item[data-id]")) || []
      );
      let d, h = Number.POSITIVE_INFINITY;
      for (const f of c) {
        const m = f.getAttribute("data-id") || void 0;
        if (!m || m === t || nt(this.locations, t, m))
          continue;
        const g = f.getBoundingClientRect(), b = g.top + g.height / 2, A = Math.abs(o - b);
        A < h && (h = A, d = m);
      }
      if (d) return d;
    }
    let r = i;
    for (; r; ) {
      if (r.classList.contains("tree-item")) {
        const c = r.getAttribute("data-id") || void 0;
        if (c && c !== t && !nt(this.locations, t, c))
          return c;
      }
      r = e.willInsertAfter ? r.nextElementSibling : r.previousElementSibling;
    }
  }
  willUpdate(e) {
    super.willUpdate(e), e.has("locations") && this.locations.length > 0 && this._initializeExpansion();
  }
  firstUpdated() {
    this._initializeSortable();
  }
  updated(e) {
    super.updated(e), (e.has("locations") || e.has("version")) && (this._cleanupDuplicateTreeItems(), this._isDragging || this._initializeSortable());
  }
  _initializeExpansion() {
    if (this.locations.length === 0) return;
    const e = /* @__PURE__ */ new Set();
    for (const t of this.locations)
      t.parent_id && e.add(t.parent_id);
    if (!this._hasInitializedExpansion)
      this._expandedIds = new Set(e), this._hasInitializedExpansion = !0;
    else
      for (const t of e)
        if (!this._expandedIds.has(t)) {
          const i = new Set(this._expandedIds);
          i.add(t), this._expandedIds = i;
        }
  }
  _initializeSortable() {
    var e;
    (e = this._sortable) == null || e.destroy(), this.updateComplete.then(() => {
      var i;
      const t = (i = this.shadowRoot) == null ? void 0 : i.querySelector(".tree-list");
      t && (this._sortable = v.create(t, {
        handle: ".drag-handle:not(.disabled)",
        animation: 150,
        ghostClass: "sortable-ghost",
        // Keep all rows as valid drop targets; floors are non-draggable via disabled handle.
        draggable: ".tree-item",
        onStart: () => {
          this._isDragging = !0;
        },
        onMove: (o) => {
          var l, s;
          const r = o.related;
          if (r != null && r.classList.contains("tree-item")) {
            const c = this._resolveRelatedId(o), h = ((c ? (l = this.shadowRoot) == null ? void 0 : l.querySelector(
              `.tree-item[data-id="${c}"]`
            ) : null) || r).getBoundingClientRect();
            this._lastDropContext = {
              relatedId: c ?? r.getAttribute("data-id") ?? void 0,
              willInsertAfter: o.willInsertAfter,
              pointerX: (s = o.originalEvent) == null ? void 0 : s.clientX,
              relatedLeft: h.left
            };
          }
          const a = r;
          if (a && a.classList.contains("tree-item")) {
            const c = a.getAttribute("data-id");
            c && !this._expandedIds.has(c) && (this._autoExpandTimer && window.clearTimeout(this._autoExpandTimer), this._autoExpandTimer = window.setTimeout(() => {
              const d = new Set(this._expandedIds);
              d.add(c), this._expandedIds = d;
            }, 800));
          }
          return !0;
        },
        onEnd: (o) => {
          this._autoExpandTimer && window.clearTimeout(this._autoExpandTimer), this._isDragging = !1, this._handleDragEnd(o), this._lastDropContext = void 0, this.updateComplete.then(() => {
            this._cleanupDuplicateTreeItems(), this._initializeSortable();
          });
        }
      }));
    });
  }
  _handleDragEnd(e) {
    var A, L;
    const { item: t, newIndex: i, oldIndex: o } = e;
    if (i === void 0 || o === void 0) return;
    const r = t.getAttribute("data-id");
    if (!r) return;
    const a = this.locations.find((T) => T.id === r);
    if (!a) return;
    const l = (A = e.originalEvent) == null ? void 0 : A.clientX, s = (L = e.originalEvent) == null ? void 0 : L.clientY, d = this._resolveDropContextFromPointer(r, l, s) || this._lastDropContext, h = Ai(this.locations, this._expandedIds), f = hn(
      h,
      r,
      o,
      i,
      a.parent_id,
      d
    ), m = f.parentId, g = f.siblingIndex, b = h.slice(0, o).filter((T) => T.location.parent_id === a.parent_id).length;
    if (m === a.parent_id && g === b) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    if (!To({ locations: this.locations, locationId: r, newParentId: m })) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    this.dispatchEvent(new CustomEvent("location-moved", {
      detail: { locationId: r, newParentId: m, newIndex: g },
      bubbles: !0,
      composed: !0
    }));
  }
  _restoreTreeAfterCancelledDrop() {
    this.requestUpdate(), this.updateComplete.then(() => {
      this._cleanupDuplicateTreeItems(), this._initializeSortable();
    });
  }
  _cleanupDuplicateTreeItems() {
    var o;
    const e = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".tree-list");
    if (!e) return;
    const t = Array.from(e.querySelectorAll(".tree-item[data-id]")), i = /* @__PURE__ */ new Set();
    for (const r of t) {
      const a = r.getAttribute("data-id");
      if (a) {
        if (i.has(a)) {
          r.remove();
          continue;
        }
        i.add(a);
      }
    }
  }
  render() {
    if (!this.locations.length)
      return u`
        <div class="empty-state">
          <ha-icon icon="mdi:map-marker-plus"></ha-icon>
          <div>No locations yet. Create your first location to get started.</div>
          <button class="button" @click=${this._handleCreate}>+ New Location</button>
        </div>
      `;
    const e = Ai(this.locations, this._expandedIds);
    return u`
      <div class="tree-list">
        ${Ro(
      e,
      (t) => `${this.version}:${t.location.id}:${t.depth}`,
      (t) => this._renderItem(t)
    )}
      </div>
    `;
  }
  _renderItem(e) {
    const { location: t, depth: i, hasChildren: o, isExpanded: r } = e, a = this.selectedId === t.id, l = this._editingId === t.id, s = i * 24, c = Y(t);
    return u`
      <div
        class="tree-item ${a ? "selected" : ""} ${c === "floor" ? "floor-item" : ""}"
        data-id=${t.id}
        style="margin-left: ${s}px"
        @click=${(d) => this._handleClick(d, t)}
      >
        <div
          class="drag-handle ${c === "floor" ? "disabled" : ""}"
          title=${c === "floor" ? "Floors are fixed at top level" : "Drag to reorder or move levels."}
        ><ha-icon icon="mdi:drag-vertical"></ha-icon></div>

        <button
          class="expand-btn ${r ? "expanded" : ""} ${o ? "" : "hidden"}"
          @click=${(d) => this._handleExpand(d, t.id)}
        >
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>

        <div class="location-icon">
          <ha-icon .icon=${this._getIcon(t)}></ha-icon>
        </div>

        ${l ? u`<input class="location-name-input" .value=${this._editingValue}
                  @input=${(d) => this._editingValue = d.target.value}
                  @blur=${() => this._finishEditing(t.id)}
                  @keydown=${(d) => this._handleEditKeydown(d, t.id)}
                  @click=${(d) => d.stopPropagation()} />` : u`<div class="location-name" @dblclick=${(d) => this._startEditing(d, t)}>${t.name}</div>`}

        <span class="type-badge ${c}">${c}</span>

        <button class="delete-btn" @click=${(d) => this._handleDelete(d, t)} title="Delete"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
      </div>
    `;
  }
  _getIcon(e) {
    var i, o, r;
    return e.ha_area_id && ((r = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[e.ha_area_id]) != null && r.icon) ? this.hass.areas[e.ha_area_id].icon : Y(e) === "floor" ? "mdi:layers" : "mdi:map-marker";
  }
  _handleClick(e, t) {
    const i = e.target;
    i.closest(".drag-handle") || i.closest(".expand-btn") || i.closest(".delete-btn") || this.dispatchEvent(new CustomEvent("location-selected", { detail: { locationId: t.id }, bubbles: !0, composed: !0 }));
  }
  _handleExpand(e, t) {
    e.stopPropagation();
    const i = new Set(this._expandedIds);
    i.has(t) ? i.delete(t) : i.add(t), this._expandedIds = i;
  }
  _startEditing(e, t) {
    e.stopPropagation(), this._editingId = t.id, this._editingValue = t.name, this.updateComplete.then(() => {
      var o;
      const i = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".location-name-input");
      i == null || i.focus(), i == null || i.select();
    });
  }
  _handleEditKeydown(e, t) {
    e.key === "Enter" ? (e.preventDefault(), this._finishEditing(t)) : e.key === "Escape" && (this._editingId = void 0);
  }
  _finishEditing(e) {
    var i;
    if (this._editingId !== e) return;
    const t = this._editingValue.trim();
    this._editingId = void 0, !(!t || t === ((i = this.locations.find((o) => o.id === e)) == null ? void 0 : i.name)) && this.dispatchEvent(new CustomEvent("location-renamed", { detail: { locationId: e, newName: t }, bubbles: !0, composed: !0 }));
  }
  _handleDelete(e, t) {
    e.stopPropagation(), confirm(`Delete "${t.name}"?`) && this.dispatchEvent(new CustomEvent("location-delete", { detail: { location: t }, bubbles: !0, composed: !0 }));
  }
  _handleCreate() {
    this.dispatchEvent(new CustomEvent("location-create", { bubbles: !0, composed: !0 }));
  }
};
mt.properties = {
  hass: { attribute: !1 },
  locations: { attribute: !1 },
  version: { type: Number },
  selectedId: {},
  // Internal state
  _expandedIds: { state: !0 },
  _editingId: { state: !0 },
  _editingValue: { state: !0 },
  _isDragging: { state: !0 }
}, mt.styles = [
  ye,
  se`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .tree-list {
        padding: var(--spacing-md);
        min-height: 100px;
      }

      .tree-item {
        display: flex;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        border-radius: var(--border-radius);
        transition: background var(--transition-speed);
        user-select: none;
        color: var(--primary-text-color);
        gap: var(--spacing-xs);
        min-height: 36px;
      }

      .tree-item:hover {
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.04);
      }

      .tree-item.selected {
        background: rgba(var(--rgb-primary-color), 0.12);
        color: var(--primary-color);
        font-weight: 600;
      }

      .tree-item.selected:hover {
        background: rgba(var(--rgb-primary-color), 0.2);
      }

      .drag-handle {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        opacity: 0.35;
        color: var(--secondary-text-color);
        flex-shrink: 0;
        margin-right: var(--spacing-xs);
      }

      .tree-item:hover .drag-handle {
        opacity: 0.9;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .tree-item.floor-item .drag-handle {
        opacity: 0.12;
        cursor: not-allowed;
      }

      .tree-item.floor-item:hover .drag-handle {
        opacity: 0.18;
      }

      .drag-handle.disabled {
        pointer-events: none;
      }

      .expand-btn {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        border: none;
        background: transparent;
        color: inherit;
        padding: 0;
        transition: transform 0.2s;
      }

      .expand-btn.expanded {
        transform: rotate(90deg);
      }

      .expand-btn.hidden {
        visibility: hidden;
      }

      .location-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--secondary-text-color);
      }

      .tree-item.selected .location-icon {
        color: var(--primary-color);
      }

      .location-name {
        flex: 1;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .location-name-input {
        flex: 1;
        background: var(--card-background-color);
        border: 2px solid var(--primary-color);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 14px;
        color: var(--primary-text-color);
        outline: none;
      }

      .type-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: var(--spacing-sm);
        flex-shrink: 0;
      }

      .type-badge.floor {
        background: rgba(var(--rgb-primary-color), 0.15);
        color: var(--primary-color);
      }

      .type-badge.area {
        background: rgba(var(--rgb-warning-color), 0.15);
        color: var(--warning-color);
      }

      .tree-item.selected .type-badge.floor {
        background: var(--primary-color);
        color: white;
      }

      .tree-item.selected .type-badge.area {
        background: var(--warning-color);
        color: white;
      }

      .delete-btn {
        opacity: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .delete-btn {
        opacity: 0.6;
      }

      .delete-btn:hover {
        color: var(--error-color);
        opacity: 1;
      }

      .sortable-ghost {
        opacity: 0.5;
        background: rgba(var(--rgb-primary-color), 0.12);
      }

      .sortable-chosen {
        background: rgba(var(--rgb-primary-color), 0.08);
      }
    `
];
let Bt = mt;
customElements.get("ht-location-tree") || customElements.define("ht-location-tree", Bt);
function un(n) {
  const e = n.toLowerCase(), t = {
    kitchen: ["kitchen", "kitchenette"],
    bedroom: ["bedroom", "bed", "master bedroom", "guest room", "kids room"],
    bathroom: ["bathroom", "bath", "half bath", "powder room"],
    living: ["living room", "family room", "den"],
    dining: ["dining room", "dining"],
    office: ["office", "study", "home office"],
    garage: ["garage", "carport"],
    patio: ["patio", "deck", "porch"],
    utility: ["laundry", "utility room"],
    storage: ["closet", "pantry", "attic"],
    gym: ["gym", "exercise room"],
    theater: ["media room", "theater"]
  }, i = {
    kitchen: "mdi:silverware-fork-knife",
    bedroom: "mdi:bed",
    bathroom: "mdi:shower",
    living: "mdi:sofa",
    dining: "mdi:table-furniture",
    office: "mdi:desk",
    garage: "mdi:garage",
    patio: "mdi:flower",
    utility: "mdi:washing-machine",
    storage: "mdi:package-variant",
    gym: "mdi:dumbbell",
    theater: "mdi:theater"
  };
  for (const [o, r] of Object.entries(t))
    if (r.some((a) => e.includes(a)))
      return i[o] ?? null;
  return null;
}
function pn(n) {
  return {
    floor: "mdi:layers",
    area: "mdi:map-marker"
  }[n] ?? "mdi:map-marker";
}
function gn(n) {
  var o;
  const e = (o = n.modules) == null ? void 0 : o._meta;
  if (e != null && e.icon) return String(e.icon);
  const t = un(n.name);
  if (t) return t;
  const i = (e == null ? void 0 : e.type) ?? "area";
  return pn(i);
}
console.log("[ht-location-inspector] module loaded");
var Ci, Ti;
try {
  (Ti = (Ci = import.meta) == null ? void 0 : Ci.hot) == null || Ti.accept(() => window.location.reload());
} catch {
}
const _t = class _t extends X {
  constructor() {
    super(...arguments), this._activeTab = "occupancy";
  }
  render() {
    return this.location ? u`
      <div class="inspector-container">
        ${this._renderHeader()} ${this._renderTabs()} ${this._renderContent()}
      </div>
    ` : u`
        <div class="empty-state">
          <div class="empty-state-icon">
            <ha-icon .icon=${"mdi:arrow-left"}></ha-icon>
          </div>
          <div>Select a location to view details</div>
        </div>
      `;
  }
  _renderHeader() {
    return this.location ? u`
      <div class="header">
        <div class="header-icon">
          <ha-icon .icon=${gn(this.location)}></ha-icon>
        </div>
        <div class="header-content">
          <div class="location-name">${this.location.name}</div>
          <div class="location-id">
            <span class="id-label">Identifier:</span>${this.location.id}
          </div>
        </div>
      </div>
    ` : "";
  }
  _renderTabs() {
    return u`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "occupancy" ? "active" : ""}"
          @click=${() => this._activeTab = "occupancy"}
        >
          Occupancy
        </button>
        <button
          class="tab ${this._activeTab === "actions" ? "active" : ""}"
          @click=${() => this._activeTab = "actions"}
        >
          Actions
        </button>
      </div>
    `;
  }
  _renderContent() {
    return u`
      <div class="tab-content">
        ${this._activeTab === "occupancy" ? this._renderOccupancyTab() : this._renderActionsTab()}
      </div>
    `;
  }
  _renderOccupancyTab() {
    if (!this.location) return "";
    const e = this.location.modules.occupancy || {}, t = this._isFloorLocation(), i = e.enabled ?? !0, o = e.default_timeout || 300, r = (e.occupancy_sources || []).length;
    return t ? u`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:layers"}></ha-icon>
            Floor Occupancy Policy
          </div>
          <div class="policy-note">
            Occupancy sources are disabled for floor locations. Assign sensors to area locations, then
            use floor-level automation by aggregating those child areas.
          </div>
          ${r > 0 ? u`
                <div class="policy-warning">
                  This floor still has ${r} legacy source${r === 1 ? "" : "s"} in
                  config. Floor sources are unsupported and should be moved to areas.
                </div>
              ` : ""}
        </div>
      ` : u`
      <div>
        <!-- Occupancy settings -->
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:tune-variant"}></ha-icon>
            Occupancy Settings
          </div>
          <div class="settings-grid">
            <div class="config-row">
              <div class="config-label">Enable Occupancy Tracking</div>
              <div class="config-value">
                <div class="toggle ${i ? "on" : ""}" @click=${this._toggleEnabled}></div>
              </div>
            </div>

            ${i ? u`
              <div class="config-row">
                <div class="config-label">Default Timeout</div>
                <div class="config-value">
                  <input
                    type="number"
                    class="input"
                    .value=${Math.floor(o / 60)}
                    @change=${this._handleTimeoutChange}
                  />
                  <span class="text-muted">min</span>
                </div>
              </div>
            ` : ""}
          </div>
        </div>

        <!-- Occupancy sources -->
        ${i ? u`
          <div class="card-section">
            <div class="section-title">
              Occupancy Sources
            </div>
            <div class="subsection-header">
              <div class="subsection-title">Area Sensors</div>
              <button
                class="button button-secondary"
                data-testid="add-source-button"
                @click=${() => this._handleAddSource({ restrictToArea: !1 })}
              >
                + Add External Source
              </button>
            </div>
            ${this._renderAreaSensorList(e)}
            <div class="subsection-header">
              <div class="subsection-title">Configured Source Rules</div>
            </div>
            <div class="sources-list">
              ${this._renderOccupancySources(e)}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }
  _renderAreaSensorList(e) {
    if (!this.location) return "";
    const t = e.occupancy_sources || [], i = /* @__PURE__ */ new Map();
    t.forEach((r, a) => i.set(r.entity_id, a));
    const o = [...this.location.entity_ids || []].sort(
      (r, a) => this._entityName(r).localeCompare(this._entityName(a))
    );
    return o.length ? u`
      <div class="candidate-list">
        ${o.map((r) => {
      const a = i.get(r), l = a !== void 0, s = l ? t[a] : void 0, c = () => {
        if (l && s) {
          this._handleEditSource(s, a);
          return;
        }
        this._handleAddSource({ entityId: r, restrictToArea: !0 });
      };
      return u`
            <div
              class="candidate-item"
              role="button"
              tabindex="0"
              @click=${c}
              @keydown=${(d) => {
        (d.key === "Enter" || d.key === " ") && (d.preventDefault(), c());
      }}
            >
              <div>
                <div class="candidate-title">${this._entityName(r)}</div>
                <div class="candidate-meta">${r} • ${this._entityState(r)}</div>
              </div>
              <div class="candidate-actions">
                <span class="status-pill ${l ? "active" : ""}">
                  ${l ? "Configured" : "Available"}
                </span>
                ${l && s ? u`
                      <button
                        class="mini-button"
                        title="Configure this source"
                        @click=${(d) => {
        d.stopPropagation(), this._handleEditSource(s, a);
      }}
                      >
                        Configure
                      </button>
                    ` : u`
                      <button
                        class="mini-button"
                        data-testid="use-area-source-button"
                        data-entity-id=${r}
                        title="Use this area entity as an occupancy source"
                        @click=${(d) => {
        d.stopPropagation(), this._handleAddSource({ entityId: r, restrictToArea: !0 });
      }}
                      >
                        Use Source
                      </button>
                    `}
              </div>
            </div>
          `;
    })}
      </div>
    ` : u`
        <div class="empty-state">
          <div class="text-muted">No entities are currently assigned to this area in Home Assistant.</div>
        </div>
      `;
  }
  _renderOccupancySources(e) {
    const t = e.occupancy_sources || [], i = this._computeSourceContributionSummary(t);
    return t.length ? u`
      <div class="contribution-summary">
        <div><strong>Source contribution summary</strong></div>
        <div class="contribution-grid">
          <div class="contribution-cell">
            <div class="contribution-label">Can Trigger</div>
            <div class="contribution-value">${i.triggers}</div>
          </div>
          <div class="contribution-cell">
            <div class="contribution-label">Can Clear</div>
            <div class="contribution-value">${i.clears}</div>
          </div>
          <div class="contribution-cell">
            <div class="contribution-label">Indefinite ON</div>
            <div class="contribution-value">${i.indefinite}</div>
          </div>
          <div class="contribution-cell">
            <div class="contribution-label">No Effect</div>
            <div class="contribution-value">${i.ignored}</div>
          </div>
        </div>
      </div>
      ${t.map(
      (o, r) => u`
          <div class="source-item">
            <div class="source-icon">
              <ha-icon .icon=${"mdi:target"}></ha-icon>
            </div>
            <div class="source-info">
              <div class="source-name">${this._entityName(o.entity_id)}</div>
              <div class="source-details">
                ${o.entity_id} • ${this._describeSource(o, e.default_timeout || 300)}
              </div>
              <div class="source-events">
                ${this._renderSourceEventChips(o, e.default_timeout || 300)}
              </div>
            </div>
            <div class="source-actions">
              <button
                class="mini-button"
                title="Edit source behavior"
                @click=${() => this._handleEditSource(o, r)}
              >
                Configure
              </button>
              <button
                class="mini-button"
                title="Send test trigger for this source"
                ?disabled=${o.on_event !== "trigger"}
                @click=${() => this._handleTestSource(o, "trigger")}
              >
                Test ON
              </button>
              <button
                class="mini-button"
                title="Send test clear for this source"
                ?disabled=${o.off_event !== "clear"}
                @click=${() => this._handleTestSource(o, "clear")}
              >
                Test OFF
              </button>
            </div>
          </div>
        `
    )}
    ` : u`
        <div class="empty-state">
          <div class="text-muted">
            No source rules configured yet. Pick an area sensor above or add an external source.
          </div>
        </div>
      `;
  }
  _renderActionsTab() {
    if (!this.location) return "";
    const t = (this.location.modules.automation || {}).rules || [];
    return u`
      <div>
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:flash"}></ha-icon>
            Automation Rules
          </div>

          <div class="rules-list">
            ${t.length === 0 ? u`
                  <div class="empty-state">
                    <div class="text-muted">No rules configured. Behavior is strictly manual.</div>
                  </div>
                ` : t.map(
      (i) => u`
                    <div class="source-item">
                      <div class="source-icon">
                        <ha-icon .icon=${"mdi:robot"}></ha-icon>
                      </div>
                      <div class="source-info">
                        <div class="source-name">${i.name}</div>
                        <div class="source-details">
                          When ${i.trigger_type} → ${i.action_service}
                        </div>
                      </div>
                      <button class="icon-button" @click=${() => this._handleDeleteRule(i.id)}>
                        <ha-icon .icon=${"mdi:delete-outline"}></ha-icon>
                      </button>
                    </div>
                  `
    )}
          </div>

          <button
            class="button button-primary"
            style="margin-top: 16px;"
            @click=${this._handleAddRule}
          >
            + Add Rule
          </button>
        </div>

        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:information-outline"}></ha-icon>
            How it works
          </div>
          <div class="text-muted" style="font-size: 13px; line-height: 1.4;">
            Rules trigger actions based on the occupancy state of this location.
            For example, you can automatically turn on lights when someone enters.
          </div>
        </div>
      </div>
    `;
  }
  _handleAddSource(e) {
    if (this._isFloorLocation()) {
      this._showToast("Floors cannot have occupancy sources. Add sensors to an area.", "error");
      return;
    }
    this.dispatchEvent(new CustomEvent("add-source", {
      detail: e,
      bubbles: !0,
      composed: !0
    }));
  }
  _handleEditSource(e, t) {
    if (this._isFloorLocation()) {
      this._showToast("Floor source editing is disabled. Configure sources on areas.", "error");
      return;
    }
    this.dispatchEvent(
      new CustomEvent("edit-source", {
        detail: { source: e, sourceIndex: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  _describeSource(e, t) {
    const i = e.mode === "any_change" ? "Any change" : "Specific states", o = e.on_timeout === null ? null : e.on_timeout ?? t, r = e.off_trailing ?? 0, a = e.on_event === "trigger" ? `ON: trigger (${this._formatDuration(o)})` : "ON: ignore", l = e.off_event === "clear" ? `OFF: clear (${this._formatDuration(r)})` : "OFF: ignore";
    return `${i} • ${a} • ${l}`;
  }
  _renderSourceEventChips(e, t) {
    const i = [], o = e.on_timeout === null ? null : e.on_timeout ?? t, r = e.off_trailing ?? 0;
    return e.on_event === "trigger" ? i.push(u`<span class="event-chip">ON -> trigger (${this._formatDuration(o)})</span>`) : i.push(u`<span class="event-chip ignore">ON ignored</span>`), e.off_event === "clear" ? i.push(
      u`<span class="event-chip off">OFF -> clear (${this._formatDuration(r)})</span>`
    ) : i.push(u`<span class="event-chip ignore">OFF ignored</span>`), i;
  }
  _computeSourceContributionSummary(e) {
    let t = 0, i = 0, o = 0, r = 0;
    for (const a of e) {
      const l = a.on_event === "trigger", s = a.off_event === "clear";
      l && (t += 1), s && (i += 1), l && a.on_timeout === null && (o += 1), !l && !s && (r += 1);
    }
    return { triggers: t, clears: i, indefinite: o, ignored: r };
  }
  _formatDuration(e) {
    return e === null ? "indefinite" : !e || e <= 0 ? "0m" : `${Math.floor(e / 60)}m`;
  }
  _entityName(e) {
    var t, i;
    return ((i = (t = this.hass.states[e]) == null ? void 0 : t.attributes) == null ? void 0 : i.friendly_name) || e;
  }
  _entityState(e) {
    var i;
    const t = (i = this.hass.states[e]) == null ? void 0 : i.state;
    return t || "unknown";
  }
  async _handleTestSource(e, t) {
    if (!(!this.location || this._isFloorLocation()))
      try {
        if (t === "trigger") {
          const o = (this.location.modules.occupancy || {}).default_timeout || 300, r = e.on_timeout === null ? o : e.on_timeout ?? o;
          await this.hass.callWS({
            type: "call_service",
            domain: "home_topology",
            service: "trigger",
            service_data: {
              location_id: this.location.id,
              source_id: e.entity_id,
              timeout: r
            }
          }), this.dispatchEvent(
            new CustomEvent("source-test", {
              detail: {
                action: "trigger",
                locationId: this.location.id,
                sourceId: e.entity_id,
                timeout: r
              },
              bubbles: !0,
              composed: !0
            })
          ), this._showToast(`Triggered ${e.entity_id}`, "success");
          return;
        }
        const i = e.off_trailing ?? 0;
        await this.hass.callWS({
          type: "call_service",
          domain: "home_topology",
          service: "clear",
          service_data: {
            location_id: this.location.id,
            source_id: e.entity_id,
            trailing_timeout: i
          }
        }), this.dispatchEvent(
          new CustomEvent("source-test", {
            detail: {
              action: "clear",
              locationId: this.location.id,
              sourceId: e.entity_id,
              trailing_timeout: i
            },
            bubbles: !0,
            composed: !0
          })
        ), this._showToast(`Cleared ${e.entity_id}`, "success");
      } catch (i) {
        console.error("Failed to test source event:", i), this._showToast((i == null ? void 0 : i.message) || "Failed to run source test", "error");
      }
  }
  _showToast(e, t = "success") {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: {
          message: e,
          type: t === "error" ? "error" : void 0
        },
        bubbles: !0,
        composed: !0
      })
    );
  }
  _handleAddRule() {
    this.dispatchEvent(new CustomEvent("add-rule", {
      bubbles: !0,
      composed: !0
    }));
  }
  async _handleDeleteRule(e) {
    if (!confirm("Are you sure you want to delete this rule?") || !this.location) return;
    const t = this.location.modules.automation || {}, o = (t.rules || []).filter((r) => r.id !== e);
    await this._updateModuleConfig("automation", { ...t, rules: o });
  }
  async _updateModuleConfig(e, t) {
    if (this.location)
      try {
        await this.hass.callWS({
          type: "home_topology/locations/set_module_config",
          location_id: this.location.id,
          module_id: e,
          config: t
        }), this.location.modules[e] = t, this.requestUpdate();
      } catch (i) {
        console.error("Failed to update config:", i), alert("Failed to update configuration");
      }
  }
  _toggleEnabled() {
    if (!this.location || this._isFloorLocation()) return;
    const e = this.location.modules.occupancy || {}, t = !(e.enabled ?? !0);
    this._updateConfig({ ...e, enabled: t });
  }
  _handleTimeoutChange(e) {
    const t = e.target, o = parseInt(t.value, 10) * 60;
    if (!this.location || this._isFloorLocation()) return;
    const r = this.location.modules.occupancy || {};
    this._updateConfig({ ...r, default_timeout: o });
  }
  async _updateConfig(e) {
    await this._updateModuleConfig("occupancy", e);
  }
  _isFloorLocation() {
    return !!this.location && Y(this.location) === "floor";
  }
};
_t.properties = {
  hass: { attribute: !1 },
  location: { attribute: !1 }
}, _t.styles = [
  ye,
  se`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .inspector-container {
        padding: var(--spacing-md);
      }

      .header {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: rgba(var(--rgb-primary-color), 0.05);
        border-radius: var(--border-radius);
      }

      .header-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--card-background-color);
        border-radius: 50%;
        color: var(--primary-color);
        box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
        --mdc-icon-size: 32px;
      }

      .header-content {
        flex: 1;
      }

      .location-name {
        font-size: 24px;
        font-weight: 600;
        color: var(--primary-text-color);
        line-height: 1.2;
      }

      .location-id {
        font-size: 13px;
        font-family: var(--code-font-family, monospace);
        color: var(--secondary-text-color);
        margin-top: 4px;
        opacity: 0.8;
      }

      .id-label {
        font-weight: 600;
        text-transform: uppercase;
        font-size: 10px;
        margin-right: 4px;
        letter-spacing: 0.5px;
      }

      .card-section {
        background: var(--card-background-color);
        border-radius: var(--border-radius);
        border: 1px solid var(--divider-color);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        max-width: 900px;
      }

      .section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--secondary-text-color);
        margin-bottom: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-title ha-icon {
        --mdc-icon-size: 16px;
      }

      .tabs {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--divider-color);
      }

      .tab {
        padding: var(--spacing-sm) var(--spacing-md);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary-color);
        transition: all var(--transition-speed);
      }

      .tab:hover {
        color: var(--text-primary-color);
      }

      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .tab-content {
        padding: var(--spacing-md) 0;
      }

      .config-row {
        display: grid;
        grid-template-columns: minmax(220px, 320px) minmax(120px, max-content);
        align-items: center;
        justify-content: start;
        column-gap: 16px;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--divider-color);
      }

      .settings-grid {
        max-width: 620px;
      }

      .config-row:last-child {
        border-bottom: none;
      }

      .config-label {
        font-size: 14px;
        font-weight: 500;
      }

      .config-value {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        justify-self: start;
      }

      .toggle {
        width: 44px;
        height: 24px;
        border-radius: 12px;
        background: var(--disabled-color);
        position: relative;
        cursor: pointer;
        transition: background var(--transition-speed);
      }

      .toggle.on {
        background: var(--primary-color);
      }

      .toggle::after {
        content: "";
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        top: 2px;
        left: 2px;
        transition: transform var(--transition-speed);
      }

      .toggle.on::after {
        transform: translateX(20px);
      }

      .input {
        padding: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        font-size: 14px;
        width: 84px;
      }

      .sources-list {
        margin-top: var(--spacing-md);
        max-width: 820px;
      }

      .contribution-summary {
        margin-top: var(--spacing-sm);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: rgba(var(--rgb-primary-color), 0.05);
        font-size: 12px;
        max-width: 820px;
      }

      .contribution-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--spacing-sm);
        margin-top: var(--spacing-xs);
      }

      .contribution-cell {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        padding: 8px;
      }

      .contribution-label {
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .contribution-value {
        font-size: 16px;
        font-weight: 700;
      }

      .source-item {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr) auto;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
      }

      .source-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .source-info {
        flex: 1;
      }

      .source-name {
        font-size: 14px;
        font-weight: 500;
      }

      .source-details {
        font-size: 12px;
        color: var(--text-secondary-color);
        margin-top: var(--spacing-xs);
      }

      .source-events {
        margin-top: var(--spacing-sm);
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }

      .event-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        background: rgba(var(--rgb-primary-color), 0.08);
        color: var(--primary-color);
      }

      .event-chip.off {
        background: rgba(var(--rgb-warning-color), 0.12);
        color: var(--warning-color);
      }

      .event-chip.ignore {
        background: rgba(var(--rgb-disabled-color, 120, 120, 120), 0.18);
        color: var(--text-secondary-color);
      }

      .policy-note {
        font-size: 13px;
        color: var(--text-secondary-color);
        line-height: 1.45;
      }

      .policy-warning {
        margin-top: var(--spacing-sm);
        font-size: 12px;
        color: var(--warning-color);
      }

      .subsection-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: var(--text-secondary-color);
      }

      .subsection-header {
        margin-top: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .candidate-list {
        display: grid;
        gap: var(--spacing-sm);
        max-width: 820px;
      }

      .candidate-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--spacing-md);
        align-items: center;
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        cursor: pointer;
      }

      .candidate-item:hover {
        border-color: rgba(var(--rgb-primary-color), 0.35);
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .candidate-title {
        font-size: 14px;
        font-weight: 600;
      }

      .candidate-meta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .candidate-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
      }

      .status-pill {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.25px;
        text-transform: uppercase;
        border-radius: 999px;
        padding: 3px 8px;
        border: 1px solid var(--divider-color);
        color: var(--text-secondary-color);
      }

      .status-pill.active {
        color: var(--success-color);
        border-color: rgba(var(--rgb-success-color), 0.35);
        background: rgba(var(--rgb-success-color), 0.08);
      }

      .source-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        white-space: nowrap;
      }

      .mini-button {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
      }

      .mini-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      /* Ensure buttons are always visible */
      .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      .button-primary {
        background: var(--primary-color, #03a9f4) !important;
        color: white !important;
      }

      .button-secondary {
        color: var(--primary-color, #03a9f4) !important;
        border-color: var(--divider-color, #e0e0e0) !important;
      }

      .empty-state {
        color: var(--text-secondary-color, #757575) !important;
      }

      .empty-state .button {
        margin-top: var(--spacing-md);
      }

      @media (max-width: 900px) {
        .contribution-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 700px) {
        .config-row {
          grid-template-columns: 1fr;
          row-gap: 8px;
        }
      }
    `
];
let Wt = _t;
if (!customElements.get("ht-location-inspector"))
  try {
    console.log("[ht-location-inspector] registering custom element"), customElements.define("ht-location-inspector", Wt);
  } catch (n) {
    console.error("[ht-location-inspector] failed to define element", n);
  }
console.log("[ht-location-dialog] module loaded");
var ki, Ii;
try {
  (Ii = (ki = import.meta) == null ? void 0 : ki.hot) == null || Ii.accept(() => window.location.reload());
} catch {
}
const vt = class vt extends X {
  constructor() {
    super(...arguments), this.open = !1, this.locations = [], this._config = {
      name: "",
      type: "area"
    }, this._submitting = !1, this._computeLabel = (e) => ({
      name: "Name",
      type: "Type",
      parent_id: "Parent Location",
      icon: "Area Icon (optional)",
      create_ha_area: "Create Home Assistant Area"
    })[e.name] || e.name;
  }
  /**
   * Performance: Dialog is short-lived, minimal hass filtering needed
   */
  willUpdate(e) {
    var t, i, o;
    if (e.has("open")) {
      const r = e.get("open");
      if (console.log("[LocationDialog] willUpdate - open changed:", r, "->", this.open), console.log("[LocationDialog] Locations available:", this.locations.length, this.locations.map((a) => {
        var l, s;
        return `${a.name}(${(s = (l = a.modules) == null ? void 0 : l._meta) == null ? void 0 : s.type})`;
      })), this.open && !r) {
        if (console.log("[LocationDialog] Dialog opening, location:", this.location), this.location) {
          const a = ((t = this.location.modules) == null ? void 0 : t._meta) || {}, l = this.location.ha_area_id && ((i = this.hass) != null && i.areas) ? (o = this.hass.areas[this.location.ha_area_id]) == null ? void 0 : o.icon : void 0;
          this._config = {
            name: this.location.name,
            type: a.type || "area",
            parent_id: this.location.parent_id || void 0,
            // ADR: Icons are sourced from Home Assistant Area Registry (not stored in _meta.icon)
            icon: l || void 0
          };
        } else {
          const a = this.defaultType ?? "area", l = this.defaultParentId;
          this._config = {
            name: "",
            type: a,
            parent_id: l || void 0
          };
        }
        this._error = void 0;
      }
    }
  }
  updated(e) {
    super.updated(e), e.has("open") && this.open && this.updateComplete.then(() => {
      setTimeout(() => {
        var o, r;
        const t = (o = this.shadowRoot) == null ? void 0 : o.querySelector("ha-form");
        if (t != null && t.shadowRoot) {
          const a = t.shadowRoot.querySelector('input[type="text"]');
          if (a) {
            console.log("[LocationDialog] Focusing input:", a), a.focus(), a.select();
            return;
          }
        }
        const i = (r = this.shadowRoot) == null ? void 0 : r.querySelector('input[type="text"]');
        i && (console.log("[LocationDialog] Focusing fallback input:", i), i.focus(), i.select());
      }, 150);
    });
  }
  render() {
    console.log("[LocationDialog] render() called, open:", this.open);
    const e = this._getSchema();
    return console.log("[LocationDialog] Rendering dialog with schema:", e.length, "fields"), u`
      <ha-dialog
        .open=${this.open}
        data-testid="location-dialog"
        @closed=${this._handleClosed}
        .heading=${this.location ? "Edit Location" : "New Location"}
      >
        <div class="dialog-content">
          ${this._error ? u`
            <div class="error-message">${this._error}</div>
          ` : ""}

          <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${e}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleValueChanged}
          ></ha-form>
        </div>

        <mwc-button
          slot="secondaryAction"
          @click=${this._handleCancel}
          .disabled=${this._submitting}
        >
          Cancel
        </mwc-button>
        <mwc-button
          slot="primaryAction"
          @click=${this._handleSubmit}
          .disabled=${!this._isValid() || this._submitting}
        >
          ${this._submitting ? "Saving..." : this.location ? "Save" : "Create"}
        </mwc-button>
      </ha-dialog>
    `;
  }
  _getSchema() {
    console.log("[LocationDialog] _getSchema called, type:", this._config.type, "locations:", this.locations.length);
    const e = this._getValidParents(), t = this._includeRootOption();
    console.log("[LocationDialog] parentOptions:", e), this.location;
    const i = [
      {
        name: "name",
        required: !0,
        selector: { text: {} }
      },
      {
        // NOTE: "type" is integration metadata (stored in modules._meta), NOT a kernel property.
        // The kernel is type-agnostic. Types are used by the UI to enforce hierarchy rules
        // and map sensible defaults to HA areas.
        name: "type",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "floor", label: "Floor" },
              { value: "area", label: "Area" }
            ]
          }
        }
      },
      {
        name: "parent_id",
        selector: {
          select: {
            options: [
              ...t ? [{ value: "", label: "(Root Level)" }] : [],
              ...e
            ]
          }
        }
      }
    ];
    return i.push({
      name: "icon",
      selector: { icon: {} }
    }), i;
  }
  /**
   * Get valid parent locations based on hierarchy rules
   * See: docs/ui-design.md Section 5.3.1
   *
   * IMPORTANT: These hierarchy rules are UI-layer validations only, NOT kernel constraints.
   * The kernel allows any Location to parent any other (only enforces no cycles).
   * The integration UI enforces these sensible rules to prevent user confusion:
   * - Floors can't nest (floor → floor blocked)
   * - Rooms are terminal (room → room blocked)
   * - Buildings/Outdoor are root-level
   *
   * Power users can bypass these rules via direct API calls if needed.
   */
  _getValidParents() {
    const e = this._config.type;
    if (e === "floor") {
      const r = this.locations.find((a) => a.is_explicit_root);
      return r ? [{ value: r.id, label: r.name }] : [];
    }
    const t = qi(e), i = t.filter((r) => r !== "root");
    if (console.log("[LocationDialog] _getValidParents:", {
      currentType: e,
      allowedParentTypes: t,
      filteredTypes: i,
      totalLocations: this.locations.length
    }), i.length === 0) return [];
    const o = this.locations.filter((r) => {
      const a = Y(r);
      return i.includes(a);
    }).map((r) => ({
      value: r.id,
      label: r.name
    }));
    return console.log("[LocationDialog] Valid parents:", o.length, o.map((r) => r.label)), o;
  }
  _includeRootOption() {
    return this._config.type !== "floor" ? !0 : !this.locations.some((e) => e.is_explicit_root);
  }
  _handleValueChanged(e) {
    console.log("[LocationDialog] value-changed received:", e.detail), this._config = { ...this._config, ...e.detail.value }, console.log("[LocationDialog] Updated config:", this._config), this._error = void 0, this.requestUpdate();
  }
  _isValid() {
    return !!this._config.name && !!this._config.type;
  }
  async _handleSubmit() {
    if (console.log("[LocationDialog] Submit clicked, config:", this._config), console.log("[LocationDialog] isValid:", this._isValid(), "submitting:", this._submitting), !this._isValid() || this._submitting) {
      console.log("[LocationDialog] Submit blocked - invalid or already submitting");
      return;
    }
    this._submitting = !0, this._error = void 0;
    try {
      if (this.location)
        this._config.type === "area" && this.location.ha_area_id && await this.hass.callWS({
          type: "config/area_registry/update",
          area_id: this.location.ha_area_id,
          icon: this._config.icon || null
        }), await this.hass.callWS({
          type: "home_topology/locations/update",
          location_id: this.location.id,
          changes: {
            name: this._config.name,
            parent_id: this._config.parent_id || null
          }
        }), await this.hass.callWS({
          type: "home_topology/locations/set_module_config",
          location_id: this.location.id,
          module_id: "_meta",
          config: {
            type: this._config.type
          }
        });
      else {
        let e = null;
        this._config.type === "area" && (e = (await this.hass.callWS({
          type: "config/area_registry/create",
          name: this._config.name,
          icon: this._config.icon || void 0
        })).area_id), await this.hass.callWS({
          type: "home_topology/locations/create",
          name: this._config.name,
          parent_id: this._config.parent_id || null,
          ha_area_id: e,
          meta: {
            type: this._config.type
          }
        });
      }
      this.dispatchEvent(new CustomEvent("saved", {
        detail: {
          name: this._config.name,
          type: this._config.type,
          parent_id: this._config.parent_id,
          meta: {
            type: this._config.type
          }
        },
        bubbles: !0,
        composed: !0
      })), this.open = !1;
    } catch (e) {
      console.error("Failed to save location:", e), this._error = e.message || "Failed to save location";
    } finally {
      this._submitting = !1;
    }
  }
  _handleCancel() {
    console.log("[LocationDialog] Cancel clicked"), this.open = !1, this._handleClosed();
  }
  _handleClosed() {
    console.log("[LocationDialog] Closed event fired"), this.open = !1, this._error = void 0, this._submitting = !1, this._config = {
      name: "",
      type: "area"
    }, this.dispatchEvent(new CustomEvent("dialog-closed", {
      bubbles: !0,
      composed: !0
    }));
  }
};
vt.properties = {
  hass: { attribute: !1 },
  open: { type: Boolean },
  location: { attribute: !1 },
  locations: { attribute: !1 },
  defaultParentId: { attribute: !1 },
  defaultType: { attribute: !1 },
  // Internal state - also needs explicit declaration for Vite
  _config: { state: !0 },
  _submitting: { state: !0 },
  _error: { state: !0 }
}, vt.styles = [
  ye,
  se`
      ha-dialog {
        --mdc-dialog-min-width: 500px;
      }

      .dialog-content {
        padding: 16px 24px;
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }
      }
    `
];
let qt = vt;
customElements.get("ht-location-dialog") || customElements.define("ht-location-dialog", qt);
console.log("[ht-add-device-dialog] module loaded");
var Oi, Li;
try {
  (Li = (Oi = import.meta) == null ? void 0 : Oi.hot) == null || Li.accept(() => window.location.reload());
} catch {
}
const bt = class bt extends X {
  constructor() {
    super(...arguments), this.open = !1, this.restrictToArea = !0, this._step = 0, this._config = {}, this._submitting = !1, this._computeConfigLabel = (e) => ({
      on_event: "ON State Event",
      on_timeout: "ON Timeout",
      on_indefinite: "Indefinite (until OFF)",
      off_event: "OFF State Event",
      off_trailing: "OFF Trailing Time"
    })[e.name] || e.name;
  }
  willUpdate(e) {
    var t;
    if (super.willUpdate(e), e.has("open") && this.open) {
      const i = (t = this.prefillEntityId) == null ? void 0 : t.trim();
      this._step = i ? 1 : 0, this._config = i ? { entity_id: i } : {}, this._error = void 0;
    }
  }
  render() {
    if (!this.open) return u``;
    if (!this.location)
      return this._renderUnavailableDialog("Select an area location before adding occupancy sources.");
    if (this._isFloorLocation())
      return this._renderUnavailableDialog(
        "Floor locations cannot have occupancy sources. Assign sensors to an area location."
      );
    const e = this.restrictToArea ? "Add Occupancy Source" : "Add External Source";
    return u`
      <ha-dialog
        .open=${this.open}
        data-testid="add-device-dialog"
        @closed=${this._handleClosed}
        .heading=${e}
      >
        <div class="dialog-content">
          ${this._renderStepIndicator()}
          ${this._error ? u`<div class="error-message">${this._error}</div>` : ""}
          ${this._renderStep()}
        </div>

        ${this._step > 0 ? u`
          <mwc-button
            slot="secondaryAction"
            @click=${this._handleBack}
            .disabled=${this._submitting}
          >
            Back
          </mwc-button>
        ` : u`
          <mwc-button
            slot="secondaryAction"
            @click=${this._handleCancel}
            .disabled=${this._submitting}
          >
            Cancel
          </mwc-button>
        `}

        <mwc-button
          slot="primaryAction"
          @click=${this._handleNext}
          .disabled=${!this._canProceed() || this._submitting}
        >
          ${this._submitting ? "Adding..." : this._step === 2 ? "Add" : "Next"}
        </mwc-button>
      </ha-dialog>
    `;
  }
  _renderUnavailableDialog(e) {
    return u`
      <ha-dialog
        .open=${this.open}
        data-testid="add-device-dialog"
        @closed=${this._handleClosed}
        .heading=${"Add Occupancy Source"}
      >
        <div class="dialog-content">
          <div class="mode-description">${e}</div>
        </div>
        <mwc-button slot="primaryAction" @click=${this._handleCancel}>Close</mwc-button>
      </ha-dialog>
    `;
  }
  _renderStepIndicator() {
    return u`
      <div class="step-indicator">
        ${[0, 1, 2].map((e) => u`
          <div class="step-dot ${e === this._step ? "active" : ""} ${e < this._step ? "completed" : ""}"></div>
        `)}
      </div>
    `;
  }
  _renderStep() {
    switch (this._step) {
      case 0:
        return this._renderEntityStep();
      case 1:
        return this._renderModeStep();
      case 2:
        return this._renderConfigStep();
      default:
        return u``;
    }
  }
  _renderEntityStep() {
    var i;
    const e = (i = this.location) == null ? void 0 : i.ha_area_id, t = this.restrictToArea && e ? [e] : void 0;
    return u`
      <h3>Select Entity</h3>
      <p class="mode-description">
        ${this.restrictToArea ? "Showing entities assigned to this area." : "Search all Home Assistant entities to add a cross-area source."}
      </p>
      <ha-entity-picker
        .hass=${this.hass}
        .value=${this._config.entity_id}
        .includeAreas=${t}
        .label=${"Entity"}
        @value-changed=${(o) => {
      this._config = { ...this._config, entity_id: o.detail.value }, this.requestUpdate();
    }}
      ></ha-entity-picker>
    `;
  }
  _renderModeStep() {
    return u`
      <h3>Choose Trigger Mode</h3>
      <div class="mode-selector">
        <div
          class="mode-option ${this._config.mode === "any_change" ? "selected" : ""}"
          @click=${() => this._selectMode("any_change")}
        >
          <div class="mode-title">Any Change (Activity Detection)</div>
          <div class="mode-description">
            Triggers occupancy whenever the entity state changes.
            Best for: dimmers, volume controls, thermostats.
          </div>
        </div>

        <div
          class="mode-option ${this._config.mode === "specific_states" ? "selected" : ""}"
          @click=${() => this._selectMode("specific_states")}
        >
          <div class="mode-title">Specific States (Binary Mapping)</div>
          <div class="mode-description">
            Configure separate behavior for ON and OFF states.
            Best for: motion sensors, presence sensors, door sensors, media players.
          </div>
        </div>
      </div>
    `;
  }
  _renderConfigStep() {
    const e = this._getTemplatesForCurrentEntity(), t = this._getConfigWarnings();
    return this._config.mode === "any_change" ? u`
        ${this._renderTemplates(e)}
        ${this._renderAnyChangeConfig()}
        ${this._renderPreview()}
        ${t.length ? this._renderWarnings(t) : ""}
      ` : u`
        ${this._renderTemplates(e)}
        ${this._renderSpecificStatesConfig()}
        ${this._renderPreview()}
        ${t.length ? this._renderWarnings(t) : ""}
      `;
  }
  _renderTemplates(e) {
    return e.length ? u`
      <h3>Quick Setup</h3>
      <div class="template-list">
        ${e.map(
      (t) => u`
            <button
              class="template-button"
              @click=${() => this._applyTemplate(t)}
              type="button"
            >
              <div class="template-title">${t.label}</div>
              <div class="template-description">${t.description}</div>
            </button>
          `
    )}
      </div>
    ` : u``;
  }
  _renderAnyChangeConfig() {
    const e = [
      {
        name: "on_timeout",
        required: !0,
        selector: {
          number: {
            min: 0,
            max: 1440,
            unit_of_measurement: "min"
          }
        }
      }
    ], t = {
      on_timeout: this._config.on_timeout !== void 0 ? (this._config.on_timeout || 0) / 60 : 5
    };
    return u`
      <h3>Configure Timeout</h3>
      <p class="mode-description">How long should occupancy remain active after any state change?</p>
      <ha-form
        .hass=${this.hass}
        .data=${t}
        .schema=${e}
        .computeLabel=${() => "Timeout"}
        @value-changed=${(i) => {
      this._config = {
        ...this._config,
        on_event: "trigger",
        on_timeout: i.detail.value.on_timeout * 60
      };
    }}
      ></ha-form>
    `;
  }
  _renderSpecificStatesConfig() {
    const e = this._getActiveEventPresetId(), t = [
      {
        name: "on_event",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "trigger", label: "Trigger Occupancy" },
              { value: "none", label: "None (Ignore)" }
            ]
          }
        }
      },
      {
        name: "on_timeout",
        selector: {
          number: {
            min: 0,
            max: 1440,
            unit_of_measurement: "min"
          }
        }
      },
      {
        name: "on_indefinite",
        selector: {
          boolean: {}
        }
      },
      {
        name: "off_event",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "clear", label: "Clear Occupancy" },
              { value: "none", label: "None (Ignore)" }
            ]
          }
        }
      },
      {
        name: "off_trailing",
        selector: {
          number: {
            min: 0,
            max: 1440,
            unit_of_measurement: "min"
          }
        }
      }
    ], i = this.hass.states[this._config.entity_id || ""], o = i == null ? void 0 : i.entity_id.split(".")[0], r = this._getDefaultsForDomain(o), a = {
      on_event: this._config.on_event || r.on_event,
      on_timeout: this._config.on_timeout !== void 0 && this._config.on_timeout !== null ? this._config.on_timeout / 60 : (r.on_timeout || 0) / 60,
      on_indefinite: this._config.on_timeout === null,
      off_event: this._config.off_event || r.off_event,
      off_trailing: this._config.off_trailing !== void 0 ? this._config.off_trailing / 60 : (r.off_trailing || 0) / 60
    };
    return u`
      <h3>Configure Triggers</h3>
      <div class="mode-description">Event behavior preset</div>
      <div class="preset-row">
        ${this._renderEventPresetChip(
      "pulse",
      "Pulse",
      e === "pulse",
      () => this._applyEventPreset("pulse")
    )}
        ${this._renderEventPresetChip(
      "state_mapped",
      "State-Mapped",
      e === "state_mapped",
      () => this._applyEventPreset("state_mapped")
    )}
        ${this._renderEventPresetChip(
      "clear_only",
      "Clear-Only",
      e === "clear_only",
      () => this._applyEventPreset("clear_only")
    )}
        ${this._renderEventPresetChip(
      "ignored",
      "Ignored",
      e === "ignored",
      () => this._applyEventPreset("ignored")
    )}
      </div>
      <ha-form
        .hass=${this.hass}
        .data=${a}
        .schema=${t}
        .computeLabel=${this._computeConfigLabel}
        @value-changed=${(l) => {
      const s = l.detail.value;
      this._config = {
        ...this._config,
        on_event: s.on_event,
        on_timeout: s.on_indefinite ? null : s.on_timeout * 60,
        off_event: s.off_event,
        off_trailing: s.off_trailing * 60
      };
    }}
      ></ha-form>
    `;
  }
  _renderEventPresetChip(e, t, i, o) {
    return u`
      <button class="preset-chip ${i ? "active" : ""}" type="button" @click=${o}>
        ${t}
      </button>
    `;
  }
  _getActiveEventPresetId() {
    const e = this._config.on_event || "trigger", t = this._config.on_timeout, i = this._config.off_event || "none", o = this._config.off_trailing || 0;
    return e === "trigger" && t !== null && i === "none" ? "pulse" : e === "trigger" && t === null && i === "clear" && o === 0 ? "state_mapped" : e === "none" && i === "clear" ? "clear_only" : e === "none" && i === "none" ? "ignored" : "custom";
  }
  _applyEventPreset(e) {
    if (e === "pulse") {
      this._config = { ...this._config, on_event: "trigger", on_timeout: 300, off_event: "none", off_trailing: 0 };
      return;
    }
    if (e === "state_mapped") {
      this._config = { ...this._config, on_event: "trigger", on_timeout: null, off_event: "clear", off_trailing: 0 };
      return;
    }
    if (e === "clear_only") {
      this._config = { ...this._config, on_event: "none", on_timeout: 0, off_event: "clear", off_trailing: 0 };
      return;
    }
    this._config = { ...this._config, on_event: "none", on_timeout: 0, off_event: "none", off_trailing: 0 };
  }
  _getDefaultsForDomain(e) {
    return {
      binary_sensor: {
        on_event: "trigger",
        on_timeout: 300,
        // 5 min
        off_event: "none"
      },
      media_player: {
        on_event: "trigger",
        on_timeout: null,
        // indefinite
        off_event: "clear",
        off_trailing: 300
        // 5 min
      },
      light: {
        on_event: "trigger",
        on_timeout: 300,
        // 5 min
        off_event: "none"
      }
    }[e || ""] || {
      on_event: "trigger",
      on_timeout: 300,
      off_event: "none"
    };
  }
  _selectMode(e) {
    this._config = { ...this._config, mode: e }, this.requestUpdate();
  }
  _applyTemplate(e) {
    this._config = {
      ...this._config,
      ...e.config,
      entity_id: this._config.entity_id
    }, this.requestUpdate();
  }
  _getTemplatesForCurrentEntity() {
    var o, r;
    const e = this.hass.states[this._config.entity_id || ""], t = (o = e == null ? void 0 : e.entity_id) == null ? void 0 : o.split(".")[0], i = (r = e == null ? void 0 : e.attributes) == null ? void 0 : r.device_class;
    return this._config.mode === "any_change" ? [
      {
        id: "activity_short",
        label: "Activity Pulse (5m)",
        description: "Any change keeps occupancy active for 5 minutes.",
        config: { on_event: "trigger", on_timeout: 300, off_event: "none", off_trailing: 0 }
      },
      {
        id: "activity_long",
        label: "Activity Hold (15m)",
        description: "Any change keeps occupancy active for 15 minutes.",
        config: { on_event: "trigger", on_timeout: 900, off_event: "none", off_trailing: 0 }
      }
    ] : t === "media_player" ? [
      {
        id: "media_state",
        label: "Media Presence",
        description: "Playback triggers occupancy; idle/paused clears after 5m.",
        config: { on_event: "trigger", on_timeout: null, off_event: "clear", off_trailing: 300 }
      }
    ] : t === "binary_sensor" && (i === "door" || i === "garage_door") ? [
      {
        id: "door_entry",
        label: "Entry Door",
        description: "Door open triggers short occupancy pulse, close ignored.",
        config: { on_event: "trigger", on_timeout: 120, off_event: "none", off_trailing: 0 }
      },
      {
        id: "door_state",
        label: "Door State = Occupancy",
        description: "Open means occupied; close clears immediately.",
        config: { on_event: "trigger", on_timeout: null, off_event: "clear", off_trailing: 0 }
      }
    ] : [
      {
        id: "motion_default",
        label: "Motion Standard",
        description: "ON triggers 5m; OFF ignored.",
        config: { on_event: "trigger", on_timeout: 300, off_event: "none", off_trailing: 0 }
      },
      {
        id: "state_mapped",
        label: "State-Mapped",
        description: "ON triggers indefinitely; OFF clears immediately.",
        config: { on_event: "trigger", on_timeout: null, off_event: "clear", off_trailing: 0 }
      }
    ];
  }
  _getConfigWarnings() {
    const e = [];
    return this._config.mode === "specific_states" && (this._config.on_event === "none" && this._config.off_event === "none" && e.push("Both ON and OFF are ignored. This source will never affect occupancy."), this._config.on_event === "trigger" && this._config.on_timeout === null && this._config.off_event !== "clear" && e.push("Indefinite ON with no OFF clear can hold occupancy until manually cleared.")), this._config.mode === "any_change" && (this._config.on_timeout ?? 0) <= 0 && e.push("Timeout is 0m, so occupancy will clear almost immediately."), e;
  }
  _renderPreview() {
    const e = this._config.mode === "any_change" ? "Any-change" : "Specific-states", t = this._config.on_event === "trigger" ? `ON -> trigger (${this._formatDuration(this._config.on_timeout)})` : "ON -> ignored", i = this._config.off_event === "clear" ? `OFF -> clear (${this._formatDuration(this._config.off_trailing)})` : "OFF -> ignored", o = this._describeContribution();
    return u`
      <div class="preview-card">
        <strong>Effective behavior:</strong> ${e} • ${t} • ${i}
        <div class="mode-description" style="margin-top: 6px;">Contribution: ${o}</div>
      </div>
    `;
  }
  _describeContribution() {
    const e = this._config.on_event === "trigger", t = this._config.off_event === "clear";
    return !e && !t ? "no occupancy effect" : e && t ? "can both create and clear occupancy" : e ? "can create occupancy only" : "can clear occupancy only";
  }
  _renderWarnings(e) {
    return u`<div class="warning-card">${e.map((t) => u`<div>• ${t}</div>`)}</div>`;
  }
  _formatDuration(e) {
    return e === null ? "indefinite" : !e || e <= 0 ? "0m" : `${Math.floor(e / 60)}m`;
  }
  _canProceed() {
    if (!this.location || this._isFloorLocation()) return !1;
    switch (this._step) {
      case 0:
        return !!this._config.entity_id;
      case 1:
        return !!this._config.mode;
      case 2:
        return !0;
      default:
        return !1;
    }
  }
  async _handleNext() {
    this._step < 2 ? (this._step++, this.requestUpdate()) : await this._handleSubmit();
  }
  _handleBack() {
    this._step > 0 && (this._step--, this.requestUpdate());
  }
  async _handleSubmit() {
    var e;
    if (!(!this.location || this._submitting)) {
      if (this._isFloorLocation()) {
        this._error = "Floors cannot have occupancy sources. Assign sensors to an area.";
        return;
      }
      this._submitting = !0, this._error = void 0;
      try {
        const t = ((e = this.location.modules) == null ? void 0 : e.occupancy) || {}, i = t.occupancy_sources || [], o = {
          entity_id: this._config.entity_id,
          mode: this._config.mode,
          on_event: this._config.on_event || "trigger",
          on_timeout: this._config.on_timeout,
          off_event: this._config.off_event || "none",
          off_trailing: this._config.off_trailing
        };
        await this.hass.callWS({
          type: "home_topology/locations/set_module_config",
          location_id: this.location.id,
          module_id: "occupancy",
          config: {
            ...t,
            occupancy_sources: [...i, o]
          }
        }), this.dispatchEvent(new CustomEvent("device-added", {
          detail: { source: o },
          bubbles: !0,
          composed: !0
        })), this.open = !1;
      } catch (t) {
        console.error("Failed to add device:", t), this._error = t.message || "Failed to add device";
      } finally {
        this._submitting = !1;
      }
    }
  }
  _handleCancel() {
    this.open = !1;
  }
  _handleClosed() {
    this.open = !1, this.dispatchEvent(new CustomEvent("dialog-closed", {
      bubbles: !0,
      composed: !0
    }));
  }
  _isFloorLocation() {
    return !!this.location && Y(this.location) === "floor";
  }
};
bt.properties = {
  hass: { attribute: !1 },
  open: { type: Boolean },
  location: { attribute: !1 },
  prefillEntityId: { type: String },
  restrictToArea: { type: Boolean }
}, bt.styles = [
  ye,
  se`
      ha-dialog {
        --mdc-dialog-min-width: 500px;
      }

      .dialog-content {
        padding: 16px 24px;
        min-height: 200px;
      }

      .step-indicator {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 16px;
      }

      .step-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--divider-color);
      }

      .step-dot.active {
        background: var(--primary-color);
      }

      .step-dot.completed {
        background: var(--success-color);
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .mode-selector {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .mode-option {
        padding: 16px;
        border: 2px solid var(--divider-color);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .mode-option:hover {
        border-color: var(--primary-color);
      }

      .mode-option.selected {
        border-color: var(--primary-color);
        background: rgba(var(--rgb-primary-color), 0.1);
      }

      .mode-title {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .mode-description {
        font-size: 14px;
        color: var(--text-secondary-color);
      }

      .template-list {
        display: grid;
        gap: 8px;
        margin: 12px 0 16px;
      }

      .preset-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 8px 0 12px;
      }

      .preset-chip {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }

      .preset-chip.active {
        border-color: var(--primary-color);
        background: rgba(var(--rgb-primary-color), 0.1);
        color: var(--primary-color);
      }

      .template-button {
        text-align: left;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        border-radius: 8px;
        padding: 10px 12px;
        cursor: pointer;
      }

      .template-button:hover {
        border-color: var(--primary-color);
      }

      .template-title {
        font-weight: 600;
        font-size: 13px;
      }

      .template-description {
        color: var(--text-secondary-color);
        font-size: 12px;
        margin-top: 2px;
      }

      .preview-card {
        margin-top: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background: rgba(var(--rgb-primary-color), 0.06);
      }

      .warning-card {
        margin-top: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid rgba(var(--rgb-warning-color), 0.4);
        background: rgba(var(--rgb-warning-color), 0.08);
        color: var(--warning-color);
        font-size: 12px;
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }
      }
    `
];
let Xt = bt;
customElements.get("ht-add-device-dialog") || customElements.define("ht-add-device-dialog", Xt);
console.log("[ht-entity-config-dialog] module loaded");
var Pi, Ni;
try {
  (Ni = (Pi = import.meta) == null ? void 0 : Pi.hot) == null || Ni.accept(() => window.location.reload());
} catch {
}
const ii = class ii extends X {
  constructor() {
    super(...arguments), this.open = !1, this._submitting = !1;
  }
  willUpdate(e) {
    e.has("open") && this.open && this.source && (this._config = { ...this.source }, this._error = void 0);
  }
  render() {
    if (!this.open || !this._config) return u``;
    if (!this.location)
      return this._renderUnavailableDialog("Select an area location before editing occupancy sources.");
    if (this._isFloorLocation())
      return this._renderUnavailableDialog(
        "Floor locations cannot have occupancy sources. Move this sensor configuration to an area."
      );
    const e = this.hass.states[this._config.entity_id], i = (e == null ? void 0 : e.entity_id.split(".")[0]) === "binary_sensor" && ((e == null ? void 0 : e.attributes.device_class) === "door" || (e == null ? void 0 : e.attributes.device_class) === "garage_door");
    return u`
      <ha-dialog
        .open=${this.open}
        @closed=${this._handleClosed}
        .heading=${"Configure Occupancy Source"}
      >
        <div class="dialog-content">
          ${this._error ? u`<div class="error-message">${this._error}</div>` : ""}

          <div class="entity-header">
            <ha-icon .icon=${(e == null ? void 0 : e.attributes.icon) || "mdi:sensor"}></ha-icon>
            <div>
              <div class="entity-name">${(e == null ? void 0 : e.attributes.friendly_name) || this._config.entity_id}</div>
              <div class="entity-id">${this._config.entity_id}</div>
            </div>
          </div>

          ${this._renderModeSelector()}
          ${this._renderTemplates()}

          ${this._config.mode === "specific_states" ? u`
            ${i ? this._renderDoorPatternSelector() : ""}
            ${this._renderSpecificStatesConfig()}
          ` : u`
            ${this._renderAnyChangeConfig()}
          `}

          ${this._renderPreview()}
          ${this._renderWarnings()}
        </div>

        <mwc-button
          slot="secondaryAction"
          @click=${this._handleDelete}
          .disabled=${this._submitting}
          style="color: var(--error-color);"
        >
          Remove
        </mwc-button>

        <mwc-button
          slot="secondaryAction"
          @click=${this._handleCancel}
          .disabled=${this._submitting}
        >
          Cancel
        </mwc-button>

        <mwc-button
          slot="primaryAction"
          @click=${this._handleSubmit}
          .disabled=${this._submitting}
        >
          ${this._submitting ? "Saving..." : "Save"}
        </mwc-button>
      </ha-dialog>
    `;
  }
  _renderUnavailableDialog(e) {
    return u`
      <ha-dialog
        .open=${this.open}
        @closed=${this._handleClosed}
        .heading=${"Configure Occupancy Source"}
      >
        <div class="dialog-content">
          <div class="mode-description">${e}</div>
        </div>
        <mwc-button slot="primaryAction" @click=${this._handleCancel}>Close</mwc-button>
      </ha-dialog>
    `;
  }
  _renderModeSelector() {
    return u`
      <div class="mode-selector">
        <ha-formfield label="Any Change (Activity Detection)">
          <ha-radio
            name="mode"
            value="any_change"
            .checked=${this._config.mode === "any_change"}
            @change=${() => this._handleModeChange("any_change")}
          ></ha-radio>
        </ha-formfield>
        <ha-formfield label="Specific States (Binary Mapping)">
          <ha-radio
            name="mode"
            value="specific_states"
            .checked=${this._config.mode === "specific_states"}
            @change=${() => this._handleModeChange("specific_states")}
          ></ha-radio>
        </ha-formfield>
      </div>
    `;
  }
  _renderTemplates() {
    const e = this._getTemplates();
    return e.length ? u`
      <div class="template-list">
        ${e.map(
      (t) => u`
            <button
              class="template-button"
              @click=${() => this._applyTemplate(t)}
              type="button"
            >
              <div class="template-title">${t.label}</div>
              <div class="template-description">${t.description}</div>
            </button>
          `
    )}
      </div>
    ` : u``;
  }
  _renderDoorPatternSelector() {
    const e = this._config.on_timeout !== null && this._config.off_event === "none", t = this._config.on_timeout === null && this._config.off_event === "clear";
    return u`
      <div class="door-pattern-selector">
        <div class="section-title">Door Sensor Pattern</div>
        <div class="pattern-option">
          <ha-formfield label="Entry Door (opening indicates entry)">
            <ha-radio
              name="door-pattern"
              .checked=${e}
              @change=${() => this._applyDoorPattern("entry")}
            ></ha-radio>
          </ha-formfield>
          <div class="mode-description" style="margin-left: 32px; font-size: 13px;">
            ON → TRIGGER(2min), OFF → ignore
          </div>
        </div>
        <div class="pattern-option">
          <ha-formfield label="State Door (door state = occupancy state)">
            <ha-radio
              name="door-pattern"
              .checked=${t}
              @change=${() => this._applyDoorPattern("state")}
            ></ha-radio>
          </ha-formfield>
          <div class="mode-description" style="margin-left: 32px; font-size: 13px;">
            ON → TRIGGER(∞), OFF → CLEAR(0)
          </div>
        </div>
      </div>
    `;
  }
  _renderAnyChangeConfig() {
    const e = (this._config.on_timeout || 0) / 60;
    return u`
      <ha-textfield
        label="Timeout (minutes)"
        type="number"
        .value=${e.toString()}
        min="0"
        max="1440"
        @input=${(t) => {
      const i = parseInt(t.target.value) || 0;
      this._config = { ...this._config, on_timeout: i * 60 };
    }}
      ></ha-textfield>
    `;
  }
  _renderSpecificStatesConfig() {
    const e = this._getActiveEventPresetId(), t = this._config.on_timeout !== null ? (this._config.on_timeout || 0) / 60 : 0, i = (this._config.off_trailing || 0) / 60, o = this._config.on_timeout === null;
    return u`
      <div class="config-columns">
        <div class="config-column">
          <div class="mode-description">Event behavior preset</div>
          <div class="preset-row">
            ${this._renderEventPresetChip("Pulse", e === "pulse", () => this._applyEventPreset("pulse"))}
            ${this._renderEventPresetChip("State-Mapped", e === "state_mapped", () => this._applyEventPreset("state_mapped"))}
            ${this._renderEventPresetChip("Clear-Only", e === "clear_only", () => this._applyEventPreset("clear_only"))}
            ${this._renderEventPresetChip("Ignored", e === "ignored", () => this._applyEventPreset("ignored"))}
          </div>

          <div class="column-title">
            <span class="state-badge on">ON</span>
            ON State
          </div>

          <ha-select
            label="Event Type"
            .value=${this._config.on_event || "trigger"}
            @selected=${(r) => {
      this._config = {
        ...this._config,
        on_event: r.target.value
      };
    }}
          >
            <mwc-list-item value="trigger">Trigger Occupancy</mwc-list-item>
            <mwc-list-item value="none">None (Ignore)</mwc-list-item>
          </ha-select>

          ${this._config.on_event === "trigger" ? u`
            <ha-formfield label="Indefinite (until OFF state)">
              <ha-checkbox
                .checked=${o}
                @change=${(r) => {
      const a = r.target.checked;
      this._config = {
        ...this._config,
        on_timeout: a ? null : 300
      };
    }}
              ></ha-checkbox>
            </ha-formfield>

            ${o ? "" : u`
              <ha-textfield
                label="Timeout (minutes)"
                type="number"
                .value=${t.toString()}
                min="0"
                max="1440"
                @input=${(r) => {
      const a = parseInt(r.target.value) || 0;
      this._config = { ...this._config, on_timeout: a * 60 };
    }}
              ></ha-textfield>
            `}
          ` : ""}
        </div>

        <div class="config-column">
          <div class="column-title">
            <span class="state-badge off">OFF</span>
            OFF State
          </div>

          <ha-select
            label="Event Type"
            .value=${this._config.off_event || "none"}
            @selected=${(r) => {
      this._config = {
        ...this._config,
        off_event: r.target.value
      };
    }}
          >
            <mwc-list-item value="clear">Clear Occupancy</mwc-list-item>
            <mwc-list-item value="none">None (Ignore)</mwc-list-item>
          </ha-select>

          ${this._config.off_event === "clear" ? u`
            <ha-textfield
              label="Trailing Time (minutes)"
              type="number"
              .value=${i.toString()}
              min="0"
              max="1440"
              @input=${(r) => {
      const a = parseInt(r.target.value) || 0;
      this._config = { ...this._config, off_trailing: a * 60 };
    }}
            ></ha-textfield>
          ` : ""}
        </div>
      </div>
    `;
  }
  _renderEventPresetChip(e, t, i) {
    return u`
      <button class="preset-chip ${t ? "active" : ""}" type="button" @click=${i}>
        ${e}
      </button>
    `;
  }
  _getActiveEventPresetId() {
    var r, a, l, s;
    const e = ((r = this._config) == null ? void 0 : r.on_event) || "trigger", t = (a = this._config) == null ? void 0 : a.on_timeout, i = ((l = this._config) == null ? void 0 : l.off_event) || "none", o = ((s = this._config) == null ? void 0 : s.off_trailing) || 0;
    return e === "trigger" && t !== null && i === "none" ? "pulse" : e === "trigger" && t === null && i === "clear" && o === 0 ? "state_mapped" : e === "none" && i === "clear" ? "clear_only" : e === "none" && i === "none" ? "ignored" : "custom";
  }
  _applyEventPreset(e) {
    if (this._config) {
      if (e === "pulse") {
        this._config = { ...this._config, on_event: "trigger", on_timeout: 300, off_event: "none", off_trailing: 0 };
        return;
      }
      if (e === "state_mapped") {
        this._config = { ...this._config, on_event: "trigger", on_timeout: null, off_event: "clear", off_trailing: 0 };
        return;
      }
      if (e === "clear_only") {
        this._config = { ...this._config, on_event: "none", on_timeout: 0, off_event: "clear", off_trailing: 0 };
        return;
      }
      this._config = { ...this._config, on_event: "none", on_timeout: 0, off_event: "none", off_trailing: 0 };
    }
  }
  _handleModeChange(e) {
    this._config = { ...this._config, mode: e };
  }
  _applyTemplate(e) {
    this._config = {
      ...this._config,
      ...e.config,
      entity_id: this._config.entity_id
    };
  }
  _getTemplates() {
    var o, r;
    if (!this._config) return [];
    const e = this.hass.states[this._config.entity_id || ""], t = (o = e == null ? void 0 : e.entity_id) == null ? void 0 : o.split(".")[0], i = (r = e == null ? void 0 : e.attributes) == null ? void 0 : r.device_class;
    return this._config.mode === "any_change" ? [
      {
        id: "activity_short",
        label: "Activity Pulse (5m)",
        description: "Any change keeps occupancy active for 5 minutes.",
        config: { on_event: "trigger", on_timeout: 300, off_event: "none", off_trailing: 0 }
      },
      {
        id: "activity_long",
        label: "Activity Hold (15m)",
        description: "Any change keeps occupancy active for 15 minutes.",
        config: { on_event: "trigger", on_timeout: 900, off_event: "none", off_trailing: 0 }
      }
    ] : t === "media_player" ? [
      {
        id: "media_state",
        label: "Media Presence",
        description: "Playback triggers occupancy; idle/paused clears after 5m.",
        config: { on_event: "trigger", on_timeout: null, off_event: "clear", off_trailing: 300 }
      }
    ] : t === "binary_sensor" && (i === "door" || i === "garage_door") ? [
      {
        id: "door_entry",
        label: "Entry Door",
        description: "Door open triggers short occupancy pulse, close ignored.",
        config: { on_event: "trigger", on_timeout: 120, off_event: "none", off_trailing: 0 }
      },
      {
        id: "door_state",
        label: "Door State = Occupancy",
        description: "Open means occupied; close clears immediately.",
        config: { on_event: "trigger", on_timeout: null, off_event: "clear", off_trailing: 0 }
      }
    ] : [
      {
        id: "motion_default",
        label: "Motion Standard",
        description: "ON triggers 5m; OFF ignored.",
        config: { on_event: "trigger", on_timeout: 300, off_event: "none", off_trailing: 0 }
      },
      {
        id: "state_mapped",
        label: "State-Mapped",
        description: "ON triggers indefinitely; OFF clears immediately.",
        config: { on_event: "trigger", on_timeout: null, off_event: "clear", off_trailing: 0 }
      }
    ];
  }
  _applyDoorPattern(e) {
    e === "entry" ? this._config = {
      ...this._config,
      on_event: "trigger",
      on_timeout: 120,
      // 2 minutes
      off_event: "none"
    } : this._config = {
      ...this._config,
      on_event: "trigger",
      on_timeout: null,
      // Indefinite
      off_event: "clear",
      off_trailing: 0
    };
  }
  _renderPreview() {
    if (!this._config) return u``;
    const e = this._config.mode === "any_change" ? "Any-change" : "Specific-states", t = this._config.on_event === "trigger" ? `ON -> trigger (${this._formatDuration(this._config.on_timeout)})` : "ON -> ignored", i = this._config.off_event === "clear" ? `OFF -> clear (${this._formatDuration(this._config.off_trailing)})` : "OFF -> ignored", o = this._describeContribution();
    return u`
      <div class="preview-card">
        <strong>Effective behavior:</strong> ${e} • ${t} • ${i}
        <div class="mode-description" style="margin-top: 6px;">Contribution: ${o}</div>
      </div>
    `;
  }
  _describeContribution() {
    if (!this._config) return "";
    const e = this._config.on_event === "trigger", t = this._config.off_event === "clear";
    return !e && !t ? "no occupancy effect" : e && t ? "can both create and clear occupancy" : e ? "can create occupancy only" : "can clear occupancy only";
  }
  _renderWarnings() {
    if (!this._config) return u``;
    const e = [];
    return this._config.mode === "specific_states" && (this._config.on_event === "none" && this._config.off_event === "none" && e.push("Both ON and OFF are ignored. This source will never affect occupancy."), this._config.on_event === "trigger" && this._config.on_timeout === null && this._config.off_event !== "clear" && e.push("Indefinite ON with no OFF clear can hold occupancy until manually cleared.")), this._config.mode === "any_change" && (this._config.on_timeout ?? 0) <= 0 && e.push("Timeout is 0m, so occupancy will clear almost immediately."), e.length ? u`<div class="warning-card">${e.map((t) => u`<div>• ${t}</div>`)}</div>` : u``;
  }
  _formatDuration(e) {
    return e === null ? "indefinite" : !e || e <= 0 ? "0m" : `${Math.floor(e / 60)}m`;
  }
  async _handleSubmit() {
    var e;
    if (!(!this.location || !this._config || this._submitting)) {
      if (this._isFloorLocation()) {
        this._error = "Floors cannot have occupancy sources.";
        return;
      }
      this._submitting = !0, this._error = void 0;
      try {
        const t = ((e = this.location.modules) == null ? void 0 : e.occupancy) || {}, i = [...t.occupancy_sources || []];
        this.sourceIndex !== void 0 && (i[this.sourceIndex] = this._config), await this.hass.callWS({
          type: "home_topology/locations/set_module_config",
          location_id: this.location.id,
          module_id: "occupancy",
          config: {
            ...t,
            occupancy_sources: i
          }
        }), this.dispatchEvent(new CustomEvent("config-saved", {
          detail: { source: this._config },
          bubbles: !0,
          composed: !0
        })), this.open = !1;
      } catch (t) {
        console.error("Failed to save config:", t), this._error = t.message || "Failed to save configuration";
      } finally {
        this._submitting = !1;
      }
    }
  }
  async _handleDelete() {
    var e;
    if (!(!this.location || this.sourceIndex === void 0 || this._submitting)) {
      if (this._isFloorLocation()) {
        this._error = "Floors cannot have occupancy sources.";
        return;
      }
      if (confirm(`Remove ${this._config.entity_id} from occupancy sources?`)) {
        this._submitting = !0, this._error = void 0;
        try {
          const t = ((e = this.location.modules) == null ? void 0 : e.occupancy) || {}, i = [...t.occupancy_sources || []];
          i.splice(this.sourceIndex, 1), await this.hass.callWS({
            type: "home_topology/locations/set_module_config",
            location_id: this.location.id,
            module_id: "occupancy",
            config: {
              ...t,
              occupancy_sources: i
            }
          }), this.dispatchEvent(new CustomEvent("source-deleted", {
            detail: { index: this.sourceIndex },
            bubbles: !0,
            composed: !0
          })), this.open = !1;
        } catch (t) {
          console.error("Failed to delete source:", t), this._error = t.message || "Failed to remove source";
        } finally {
          this._submitting = !1;
        }
      }
    }
  }
  _handleCancel() {
    this.open = !1;
  }
  _handleClosed() {
    this.open = !1, this.dispatchEvent(new CustomEvent("dialog-closed", {
      bubbles: !0,
      composed: !0
    }));
  }
  _isFloorLocation() {
    return !!this.location && Y(this.location) === "floor";
  }
};
ii.styles = [
  ye,
  se`
      ha-dialog {
        --mdc-dialog-min-width: 600px;
        --mdc-dialog-max-width: 800px;
      }

      .dialog-content {
        padding: 16px 24px;
      }

      .entity-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--card-background-color);
        border-radius: 8px;
        margin-bottom: 16px;
      }

      .entity-name {
        font-weight: 500;
      }

      .entity-id {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .mode-selector {
        margin-bottom: 24px;
      }

      .config-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .config-column {
        padding: 16px;
        background: var(--card-background-color);
        border-radius: 8px;
      }

      .column-title {
        font-weight: 600;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .state-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
      }

      .state-badge.on {
        background: var(--success-color);
        color: white;
      }

      .state-badge.off {
        background: var(--divider-color);
        color: var(--text-primary-color);
      }

      .door-pattern-selector {
        margin-top: 16px;
        padding: 16px;
        background: rgba(var(--rgb-primary-color), 0.05);
        border-radius: 8px;
      }

      .pattern-option {
        margin: 8px 0;
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .template-list {
        display: grid;
        gap: 8px;
        margin: 12px 0 16px;
      }

      .preset-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 8px 0 12px;
      }

      .preset-chip {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }

      .preset-chip.active {
        border-color: var(--primary-color);
        background: rgba(var(--rgb-primary-color), 0.1);
        color: var(--primary-color);
      }

      .template-button {
        text-align: left;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        border-radius: 8px;
        padding: 10px 12px;
        cursor: pointer;
      }

      .template-button:hover {
        border-color: var(--primary-color);
      }

      .template-title {
        font-weight: 600;
        font-size: 13px;
      }

      .template-description {
        color: var(--text-secondary-color);
        font-size: 12px;
        margin-top: 2px;
      }

      .preview-card {
        margin-top: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background: rgba(var(--rgb-primary-color), 0.06);
      }

      .warning-card {
        margin-top: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid rgba(var(--rgb-warning-color), 0.4);
        background: rgba(var(--rgb-warning-color), 0.08);
        color: var(--warning-color);
        font-size: 12px;
      }

      @media (max-width: 768px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }

        .config-columns {
          grid-template-columns: 1fr;
        }
      }
    `
];
let jt = ii;
customElements.define("ht-entity-config-dialog", jt);
console.log("[ht-rule-dialog] module loaded");
const oi = class oi extends X {
  constructor() {
    super(...arguments), this.open = !1, this._config = {}, this._submitting = !1, this._computeLabel = (e) => ({
      name: "Rule Name",
      trigger_type: "Trigger When",
      action_entity_id: "Target Entity",
      action_service: "Action"
    })[e.name] || e.name;
  }
  willUpdate(e) {
    e.has("open") && this.open && (this.rule ? this._config = { ...this.rule } : this._config = {
      id: `rule-${Date.now()}`,
      name: "",
      trigger_type: "occupied",
      action_entity_id: "",
      action_service: "turn_on"
    }, this._error = void 0);
  }
  render() {
    if (!this.open) return u``;
    const e = this._getSchema();
    return u`
      <ha-dialog
        .open=${this.open}
        @closed=${this._handleClosed}
        .heading=${this.rule ? "Edit Rule" : "New Automation Rule"}
      >
        <div class="dialog-content">
          ${this._error ? u`<div class="error-message">${this._error}</div>` : ""}

          <ha-form
            .hass=${this.hass}
            .data=${this._getFormData()}
            .schema=${e}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleValueChanged}
          ></ha-form>

          ${this._renderPreview()}
        </div>

        <mwc-button
          slot="secondaryAction"
          @click=${this._handleCancel}
          .disabled=${this._submitting}
        >
          Cancel
        </mwc-button>
        <mwc-button
          slot="primaryAction"
          @click=${this._handleSubmit}
          .disabled=${!this._isValid() || this._submitting}
        >
          ${this._submitting ? "Saving..." : this.rule ? "Save" : "Create"}
        </mwc-button>
      </ha-dialog>
    `;
  }
  _getSchema() {
    return [
      {
        name: "name",
        required: !0,
        selector: { text: {} }
      },
      {
        name: "trigger_type",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "occupied", label: "When Occupied" },
              { value: "vacant", label: "When Vacant" }
            ]
          }
        }
      },
      {
        name: "action_entity_id",
        required: !0,
        selector: {
          entity: {}
        }
      },
      {
        name: "action_service",
        required: !0,
        selector: {
          select: {
            options: [
              { value: "turn_on", label: "Turn On" },
              { value: "turn_off", label: "Turn Off" },
              { value: "toggle", label: "Toggle" }
            ]
          }
        }
      }
    ];
  }
  _getFormData() {
    return {
      name: this._config.name || "",
      trigger_type: this._config.trigger_type || "occupied",
      action_entity_id: this._config.action_entity_id || "",
      action_service: this._config.action_service || "turn_on"
    };
  }
  _handleValueChanged(e) {
    const t = e.detail.value;
    this._config = {
      ...this._config,
      name: t.name,
      trigger_type: t.trigger_type,
      action_entity_id: t.action_entity_id,
      action_service: t.action_service
    };
  }
  _renderPreview() {
    var r, a;
    if (!this._config.name || !this._config.action_entity_id)
      return u``;
    const e = this.hass.states[this._config.action_entity_id], t = (e == null ? void 0 : e.attributes.friendly_name) || this._config.action_entity_id, i = this._config.trigger_type === "occupied" ? "becomes occupied" : "becomes vacant", o = (r = this._config.action_service) == null ? void 0 : r.replace("_", " ");
    return u`
      <div class="preview">
        <div class="preview-label">Preview</div>
        <div class="preview-text">
          When <strong>${((a = this.location) == null ? void 0 : a.name) || "this location"}</strong>
          ${i}, <strong>${o}</strong>
          <strong>${t}</strong>
        </div>
      </div>
    `;
  }
  _isValid() {
    return !!(this._config.name && this._config.trigger_type && this._config.action_entity_id && this._config.action_service);
  }
  async _handleSubmit() {
    var e;
    if (!(!this.location || !this._isValid() || this._submitting)) {
      this._submitting = !0, this._error = void 0;
      try {
        const t = ((e = this.location.modules) == null ? void 0 : e.automation) || { rules: [] }, i = [...t.rules || []], o = {
          id: this._config.id || `rule-${Date.now()}`,
          name: this._config.name,
          trigger_type: this._config.trigger_type,
          action_entity_id: this._config.action_entity_id,
          action_service: this._config.action_service
        };
        if (this.rule) {
          const r = i.findIndex((a) => a.id === this.rule.id);
          r !== -1 && (i[r] = o);
        } else
          i.push(o);
        await this.hass.callWS({
          type: "home_topology/locations/set_module_config",
          location_id: this.location.id,
          module_id: "automation",
          config: {
            ...t,
            rules: i
          }
        }), this.dispatchEvent(
          new CustomEvent("rule-saved", {
            detail: { rule: o },
            bubbles: !0,
            composed: !0
          })
        ), this.open = !1;
      } catch (t) {
        console.error("Failed to save rule:", t), this._error = t.message || "Failed to save rule";
      } finally {
        this._submitting = !1;
      }
    }
  }
  _handleCancel() {
    this.open = !1;
  }
  _handleClosed() {
    this.open = !1, this.dispatchEvent(
      new CustomEvent("dialog-closed", {
        bubbles: !0,
        composed: !0
      })
    );
  }
};
oi.styles = [
  ye,
  se`
      ha-dialog {
        --mdc-dialog-min-width: 500px;
      }

      .dialog-content {
        padding: 16px 24px;
      }

      .error-message {
        color: var(--error-color);
        padding: 8px 16px;
        background: rgba(var(--rgb-error-color), 0.1);
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .preview {
        padding: 16px;
        background: var(--secondary-background-color);
        border-radius: 8px;
        margin-top: 16px;
        font-size: 14px;
      }

      .preview-label {
        font-size: 12px;
        color: var(--text-secondary-color);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .preview-text {
        color: var(--primary-text-color);
      }

      @media (max-width: 600px) {
        ha-dialog {
          --mdc-dialog-min-width: 90vw;
        }
      }
    `
];
let Vt = oi;
customElements.get("ht-rule-dialog") || customElements.define("ht-rule-dialog", Vt);
console.log("[home-topology-panel] module loaded");
var Fi, Ri;
try {
  (Ri = (Fi = import.meta) == null ? void 0 : Fi.hot) == null || Ri.accept(() => window.location.reload());
} catch {
}
const yt = class yt extends X {
  constructor() {
    super(), this.narrow = !1, this._locations = [], this._locationsVersion = 0, this._loading = !0, this._pendingChanges = /* @__PURE__ */ new Map(), this._saving = !1, this._discarding = !1, this._locationDialogOpen = !1, this._addDeviceDialogOpen = !1, this._ruleDialogOpen = !1, this._entityConfigDialogOpen = !1, this._addSourceRestrictToArea = !0, this._eventLogOpen = !1, this._eventLogScope = "subtree", this._eventLogEntries = [], this._hasLoaded = !1, this._loadSeq = 0, this._opQueueByLocationId = /* @__PURE__ */ new Map(), this._handleNewLocation = (e) => {
      e && (e.preventDefault(), e.stopPropagation()), console.log("[Panel] _handleNewLocation called"), console.log("[Panel] Current _locationDialogOpen:", this._locationDialogOpen), this._editingLocation = void 0;
      const t = this._selectedId ? this._locations.find((i) => i.id === this._selectedId) : void 0;
      t ? this._newLocationDefaults = { parentId: t.id, type: "area" } : this._newLocationDefaults = void 0, this._locationDialogOpen = !0, console.log("[Panel] Opening dialog with defaults:", this._newLocationDefaults), this.requestUpdate();
    }, this._handleAddSourceDialogClosed = () => {
      this._addDeviceDialogOpen = !1, this._addSourcePrefillEntityId = void 0, this._addSourceRestrictToArea = !0;
    }, this._handleSourceDialogClosed = () => {
      this._entityConfigDialogOpen = !1, this._editingSource = void 0, this._editingSourceIndex = void 0;
    }, this._handleKeyDown = (e) => {
      (e.ctrlKey || e.metaKey) && e.key === "s" && (e.preventDefault(), this._pendingChanges.size > 0 && !this._saving && this._handleSaveChanges()), (e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && (e.preventDefault(), console.log("Undo requested")), (e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "z" && e.shiftKey) && (e.preventDefault(), console.log("Redo requested")), e.key === "Escape" && this._pendingChanges.size > 0 && !this._saving && confirm("Discard all pending changes?") && this._handleDiscardChanges(), e.key === "?" && !e.ctrlKey && !e.metaKey && this._showKeyboardShortcutsHelp();
    }, this._toggleEventLog = () => {
      this._eventLogOpen = !this._eventLogOpen;
    }, this._clearEventLog = () => {
      this._eventLogEntries = [];
    }, this._handleSourceTest = (e) => {
      this._logEvent("ui", "source test", e.detail);
    }, this._toggleEventLogScope = () => {
      this._eventLogScope = this._eventLogScope === "subtree" ? "all" : "subtree", this._logEvent(
        "ui",
        `event log scope set to ${this._eventLogScope === "subtree" ? "selected subtree" : "all locations"}`
      );
    }, console.log("HomeTopologyPanel constructed");
  }
  _enqueueLocationOp(e, t) {
    const o = (this._opQueueByLocationId.get(e) ?? Promise.resolve()).catch(() => {
    }).then(t);
    return this._opQueueByLocationId.set(e, o), o;
  }
  _scheduleReload(e = !0) {
    this._reloadTimer && (window.clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._reloadTimer = window.setTimeout(() => {
      this._reloadTimer = void 0, this._loadLocations(e);
    }, 150);
  }
  willUpdate(e) {
    super.willUpdate(e), !this._hasLoaded && this.hass && (this._hasLoaded = !0, console.log("Hass available, loading locations..."), this._loadLocations()), e.has("hass") && this.hass && this._subscribeToUpdates();
  }
  connectedCallback() {
    super.connectedCallback(), console.log("HomeTopologyPanel connected"), this._scheduleInitialLoad(), this._handleKeyDown = this._handleKeyDown.bind(this), document.addEventListener("keydown", this._handleKeyDown);
  }
  updated(e) {
    super.updated(e);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._handleKeyDown), this._pendingLoadTimer && (clearTimeout(this._pendingLoadTimer), this._pendingLoadTimer = void 0), this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0);
  }
  /**
   * CRITICAL PERFORMANCE: Filter hass updates to prevent unnecessary re-renders.
   * Without this, component re-renders on EVERY state change in HA (100+ times/min).
   * See: docs/frontend-patterns.md Section 1.1
   */
  shouldUpdate(e) {
    for (const t of e.keys())
      if (t !== "hass") return !0;
    if (e.has("hass")) {
      const t = e.get("hass");
      return !t || t.areas !== this.hass.areas;
    }
    return !0;
  }
  render() {
    if (this._loading && !this._locations.length)
      return u`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    if (this._error)
      return u`
        <div class="error-container">
          <h3>Error Loading Home Topology</h3>
          <p>${this._error}</p>
          <button class="button button-primary" @click=${this._loadLocations}>
            Retry
          </button>
        </div>
      `;
    const e = this._locations.find(
      (t) => t.id === this._selectedId
    );
    return u`
      <div class="panel-container">
        <div class="panel-left">
          ${this._renderConflictBanner()}
          <div class="header">
            <div class="header-title">Home Topology</div>
            <div class="header-subtitle">Model your space and attach behavior modules.</div>
            <div class="header-actions">
              <button
                class="button button-primary"
                @click=${this._handleNewLocation}
                data-testid="new-location-button"
              >
                + New Location
              </button>
              ${this._locations.length === 0 ? u`
                <button class="button button-secondary" @click=${this._seedDemoData}>
                  ⚡ Seed Demo Data
                </button>
              ` : ""}
              <button class="button button-secondary" @click=${this._toggleEventLog}>
                ${this._eventLogOpen ? "Hide Log" : "Event Log"}
              </button>
            </div>
          </div>
          <ht-location-tree
            .hass=${this.hass}
            .locations=${this._locations}
            .version=${this._locationsVersion}
            .selectedId=${this._selectedId}
            @location-selected=${this._handleLocationSelected}
            @location-create=${this._handleLocationCreate}
            @location-edit=${this._handleLocationEdit}
            @location-moved=${this._handleLocationMoved}
            @location-renamed=${this._handleLocationRenamed}
            @location-delete=${this._handleLocationDelete}
          ></ht-location-tree>
        </div>

        <div class="panel-right">
          <div class="header">
            <div class="header-title">${e ? e.name : "Location Details"}</div>
            <div class="header-subtitle">${e ? e.id : "Select a location to configure modules"}</div>
          </div>
          <ht-location-inspector
            .hass=${this.hass}
            .location=${e}
            @add-source=${this._handleAddSource}
            @edit-source=${this._handleEditSource}
            @add-rule=${this._handleAddRule}
            @source-test=${this._handleSourceTest}
          ></ht-location-inspector>
          ${this._eventLogOpen ? this._renderEventLog() : ""}
        </div>
      </div>

      ${this._renderDialogs()}
    `;
  }
  _renderDialogs() {
    var i, o;
    const e = this._getSelectedLocation(), t = e && this._isSourceAssignableLocation(e) ? e : void 0;
    return u`
      <ht-location-dialog
        .hass=${this.hass}
        .open=${this._locationDialogOpen}
        .location=${this._editingLocation}
        .locations=${this._locations}
        .defaultParentId=${(i = this._newLocationDefaults) == null ? void 0 : i.parentId}
        .defaultType=${(o = this._newLocationDefaults) == null ? void 0 : o.type}
        @dialog-closed=${() => {
      console.log("[Panel] Dialog closed event received"), this._locationDialogOpen = !1, this._editingLocation = void 0, this._newLocationDefaults = void 0;
    }}
        @saved=${this._handleLocationDialogSaved}
      ></ht-location-dialog>

      <ht-add-device-dialog
        .hass=${this.hass}
        .open=${this._addDeviceDialogOpen}
        .location=${t}
        .prefillEntityId=${this._addSourcePrefillEntityId}
        .restrictToArea=${this._addSourceRestrictToArea}
        @dialog-closed=${this._handleAddSourceDialogClosed}
        @device-added=${this._handleDeviceAdded}
      ></ht-add-device-dialog>

      <ht-entity-config-dialog
        .hass=${this.hass}
        .open=${this._entityConfigDialogOpen}
        .location=${t}
        .source=${this._editingSource}
        .sourceIndex=${this._editingSourceIndex}
        @config-saved=${this._handleSourceConfigSaved}
        @source-deleted=${this._handleSourceDeleted}
        @dialog-closed=${this._handleSourceDialogClosed}
      ></ht-entity-config-dialog>

      <ht-rule-dialog
        .hass=${this.hass}
        .open=${this._ruleDialogOpen}
        .location=${e}
        .rule=${this._editingRule}
        @dialog-closed=${() => {
      this._ruleDialogOpen = !1, this._editingRule = void 0;
    }}
        @rule-saved=${this._handleRuleSaved}
      ></ht-rule-dialog>
    `;
  }
  async _loadLocations(e = !1) {
    const t = ++this._loadSeq, i = e || this._locations.length > 0;
    this._loading = !i, this._error = void 0;
    try {
      if (!this.hass)
        throw new Error("Home Assistant connection not ready");
      console.log("Calling WebSocket API: home_topology/locations/list"), console.log("hass.callWS available:", typeof this.hass.callWS);
      const o = await Promise.race([
        this.hass.callWS({
          type: "home_topology/locations/list"
        }),
        new Promise(
          (s, c) => setTimeout(() => c(new Error("Timeout loading locations")), 8e3)
        )
      ]);
      console.log("WebSocket result:", o);
      const r = o;
      if (!r || !r.locations)
        throw new Error("Invalid response format: missing locations array");
      if (t !== this._loadSeq) {
        console.log("[Panel] Ignoring stale locations load", { seq: t, current: this._loadSeq });
        return;
      }
      const a = /* @__PURE__ */ new Map();
      for (const s of r.locations) a.set(s.id, s);
      const l = Array.from(a.values());
      l.length !== r.locations.length && console.warn("[Panel] Deduped locations from backend", {
        before: r.locations.length,
        after: l.length
      }), this._locations = [...l], this._locationsVersion += 1, console.log("Loaded locations:", this._locations.length, this._locations), this._logEvent("ws", "locations/list loaded", {
        count: this._locations.length
      }), !this._selectedId && this._locations.length > 0 && (this._selectedId = this._locations[0].id);
    } catch (o) {
      console.error("Failed to load locations:", o), this._error = o.message || "Failed to load locations", this._logEvent("error", "locations/list failed", (o == null ? void 0 : o.message) || o);
    } finally {
      this._loading = !1, this.requestUpdate();
    }
  }
  _scheduleInitialLoad() {
    if (!this._hasLoaded) {
      if (this.hass) {
        this._hasLoaded = !0, console.log("Hass available, loading locations..."), this._loadLocations();
        return;
      }
      this._pendingLoadTimer = window.setTimeout(() => this._scheduleInitialLoad(), 300);
    }
  }
  _handleLocationSelected(e) {
    this._selectedId = e.detail.locationId;
  }
  /**
   * Render rename conflict notification banner
   */
  _renderConflictBanner() {
    if (!this._renameConflict)
      return "";
    const { locationId: e, localName: t, haName: i } = this._renameConflict, o = this._locations.find((r) => r.id === e);
    return u`
      <div class="conflict-banner">
        <div class="conflict-content">
          <div class="conflict-title">⚠️ Rename Conflict Detected</div>
          <div class="conflict-message">
            Location "${(o == null ? void 0 : o.name) || e}" was renamed in Home Assistant to "${i}".
            Your local name is "${t}". Which name should we keep?
          </div>
        </div>
        <div class="conflict-actions">
          <button
            class="button button-text"
            @click=${() => this._handleConflictKeepLocal()}
          >
            Keep Local
          </button>
          <button
            class="button button-primary"
            @click=${() => this._handleConflictAcceptHA()}
          >
            Accept HA
          </button>
          <button
            class="button button-text"
            @click=${() => this._handleConflictDismiss()}
          >
            Dismiss
          </button>
        </div>
      </div>
    `;
  }
  _handleConflictKeepLocal() {
    if (!this._renameConflict) return;
    const { locationId: e, localName: t } = this._renameConflict;
    console.log(`[Panel] Keeping local name "${t}" for location ${e}`), this._renameConflict = void 0;
  }
  _handleConflictAcceptHA() {
    if (!this._renameConflict) return;
    const { locationId: e, haName: t } = this._renameConflict;
    console.log(`[Panel] Accepting HA name "${t}" for location ${e}`);
    const i = this._locations.find((o) => o.id === e);
    i && (i.name = t, this._locations = [...this._locations]), this._renameConflict = void 0;
  }
  _handleConflictDismiss() {
    console.log("[Panel] Dismissing rename conflict"), this._renameConflict = void 0;
  }
  _handleLocationCreate() {
    this._editingLocation = void 0;
    const e = this._selectedId ? this._locations.find((t) => t.id === this._selectedId) : void 0;
    if (e) {
      const t = "area";
      this._newLocationDefaults = { parentId: e.id, type: t };
    } else
      this._newLocationDefaults = void 0;
    this._locationDialogOpen = !0;
  }
  _handleLocationEdit(e) {
    const { location: t } = e.detail;
    console.log("[Panel] _handleLocationEdit called for:", t.name), this._editingLocation = t, this._locationDialogOpen = !0, this.requestUpdate();
  }
  async _handleLocationMoved(e) {
    const { locationId: t, newParentId: i, newIndex: o } = e.detail;
    console.log("Location moved", { locationId: t, newParentId: i, newIndex: o });
    try {
      await this.hass.callWS({
        type: "home_topology/locations/reorder",
        location_id: t,
        new_parent_id: i,
        new_index: o
      }), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast("Location moved", "success"), this._logEvent("ui", "location moved", { locationId: t, newParentId: i, newIndex: o });
    } catch (r) {
      console.error("Failed to move location:", r), this._showToast(`Failed to move: ${r.message}`, "error"), this._logEvent("error", "location move failed", (r == null ? void 0 : r.message) || r), await this._loadLocations(!0);
    }
  }
  async _handleLocationRenamed(e) {
    const { locationId: t, newName: i } = e.detail;
    console.log("Location renamed", { locationId: t, newName: i }), await this._enqueueLocationOp(t, async () => {
      try {
        await this.hass.callWS({
          type: "home_topology/locations/update",
          location_id: t,
          changes: { name: i }
        });
        const o = this._locations.findIndex((r) => r.id === t);
        o !== -1 && (this._locations[o] = { ...this._locations[o], name: i }, this._locations = [...this._locations], this._locationsVersion += 1), this._showToast(`Renamed to "${i}"`, "success"), this._logEvent("ui", "location renamed", { locationId: t, newName: i }), this._scheduleReload(!0);
      } catch (o) {
        console.error("Failed to rename location:", o), this._showToast(`Failed to rename: ${o.message}`, "error"), this._logEvent("error", "location rename failed", (o == null ? void 0 : o.message) || o), this._scheduleReload(!0);
      }
    });
  }
  async _handleLocationDelete(e) {
    var i;
    const t = e.detail.location;
    console.log("[Panel] Location delete requested", t);
    try {
      const o = await this.hass.callWS({
        type: "home_topology/locations/delete",
        location_id: t.id
      });
      console.log("[Panel] Delete API result:", o), this._locations = this._locations.filter((r) => r.id !== t.id), this._locationsVersion += 1, await this._loadLocations(!0), this._selectedId === t.id && (this._selectedId = (i = this._locations[0]) == null ? void 0 : i.id), this._showToast(`Deleted "${t.name}"`, "success"), this._logEvent("ui", "location deleted", { locationId: t.id });
    } catch (o) {
      console.error("[Panel] Failed to delete location:", o), this._showToast(`Failed to delete: ${o.message}`, "error"), this._logEvent("error", "location delete failed", (o == null ? void 0 : o.message) || o), await this._loadLocations(!0);
    }
  }
  async _handleLocationDialogSaved(e) {
    const t = e.detail;
    console.log("Location saved from dialog", t);
    const i = !!this._editingLocation;
    try {
      await this._loadLocations(!0), this._locationsVersion += 1, this._locationDialogOpen = !1, this._editingLocation = void 0, this._showToast(
        i ? `Updated "${t.name}"` : `Created "${t.name}"`,
        "success"
      );
    } catch (o) {
      console.error("Failed to reload locations:", o), this._showToast(`Failed to reload: ${o.message}`, "error");
    }
  }
  async _handleDeviceAdded(e) {
    const { source: t } = e.detail;
    console.log("Device added", t), this._showToast(`Added ${t.entity_id}`, "success"), this._logEvent("ui", "occupancy source added", t), await this._loadLocations(!0), this._handleAddSourceDialogClosed();
  }
  _handleAddSource(e) {
    const t = this._getSelectedLocation();
    if (!this._isSourceAssignableLocation(t)) {
      this._showToast("Floors cannot have occupancy sources. Add sensors to an area.", "error");
      return;
    }
    const i = (e == null ? void 0 : e.detail) || {};
    this._addSourcePrefillEntityId = i.entityId, this._addSourceRestrictToArea = i.restrictToArea ?? !0, this._addDeviceDialogOpen = !0, this.requestUpdate();
  }
  _handleEditSource(e) {
    const t = this._getSelectedLocation();
    if (!this._isSourceAssignableLocation(t)) {
      this._showToast("Floor source editing is disabled. Configure sources on areas.", "error");
      return;
    }
    const { source: i, sourceIndex: o } = e.detail;
    this._editingSource = i, this._editingSourceIndex = o, this._entityConfigDialogOpen = !0, this.requestUpdate();
  }
  async _handleSourceConfigSaved() {
    this._showToast("Updated occupancy source", "success"), this._logEvent("ui", "occupancy source updated"), await this._loadLocations(!0), this._handleSourceDialogClosed();
  }
  async _handleSourceDeleted() {
    this._showToast("Removed occupancy source", "success"), this._logEvent("ui", "occupancy source removed"), await this._loadLocations(!0), this._handleSourceDialogClosed();
  }
  _handleAddRule() {
    this._editingRule = void 0, this._ruleDialogOpen = !0;
  }
  async _handleRuleSaved(e) {
    const { rule: t } = e.detail;
    console.log("Rule saved", t), this._showToast(`Rule "${t.name}" saved`, "success"), await this._loadLocations(!0), this._ruleDialogOpen = !1, this._editingRule = void 0;
  }
  async _subscribeToUpdates() {
    if (!(!this.hass || !this.hass.connection)) {
      this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0);
      try {
        this._unsubUpdates = await this.hass.connection.subscribeEvents(
          (e) => {
            this._logEvent("ha", "home_topology_updated", (e == null ? void 0 : e.data) || {}), this._scheduleReload(!0);
          },
          "home_topology_updated"
        );
      } catch (e) {
        console.warn("Failed to subscribe to home_topology_updated events", e), this._logEvent("error", "subscribe failed: home_topology_updated", String(e));
      }
      try {
        this._unsubStateChanged = await this.hass.connection.subscribeEvents(
          (e) => {
            var r, a, l, s, c;
            const t = (r = e == null ? void 0 : e.data) == null ? void 0 : r.entity_id;
            if (!t || !this._shouldTrackEntity(t)) return;
            const i = (l = (a = e == null ? void 0 : e.data) == null ? void 0 : a.new_state) == null ? void 0 : l.state, o = (c = (s = e == null ? void 0 : e.data) == null ? void 0 : s.old_state) == null ? void 0 : c.state;
            this._logEvent("ha", "state_changed", { entityId: t, oldState: o, newState: i });
          },
          "state_changed"
        );
      } catch (e) {
        console.warn("Failed to subscribe to state_changed events", e), this._logEvent("error", "subscribe failed: state_changed", String(e));
      }
    }
  }
  _renderEventLog() {
    return u`
      <div class="event-log">
        <div class="event-log-header">
          <span>
            Runtime Event Log (${this._eventLogEntries.length})
            <span class="event-log-meta">• ${this._getEventLogScopeLabel()}</span>
          </span>
          <div class="event-log-header-actions">
            <button class="button button-secondary" @click=${this._toggleEventLogScope}>
              ${this._eventLogScope === "subtree" ? "All locations" : "Selected subtree"}
            </button>
            <button class="button button-secondary" @click=${this._clearEventLog}>Clear</button>
          </div>
        </div>
        <div class="event-log-list">
          ${this._eventLogEntries.length === 0 ? u`<div class="event-log-item event-log-meta">No events captured yet.</div>` : this._eventLogEntries.map(
      (e) => u`
                  <div class="event-log-item">
                    <div class="event-log-meta">[${e.ts}] ${e.type}</div>
                    <div>${e.message}</div>
                    ${e.data !== void 0 ? u`<div class="event-log-meta">${this._safeStringify(e.data)}</div>` : ""}
                  </div>
                `
    )}
        </div>
      </div>
    `;
  }
  _shouldTrackEntity(e) {
    return this._eventLogScope === "all" ? this._isTrackedEntity(e) : this._isTrackedEntityInSelectedSubtree(e);
  }
  _isTrackedEntity(e) {
    var i, o;
    const t = /* @__PURE__ */ new Set();
    for (const r of this._locations) {
      for (const l of r.entity_ids || []) t.add(l);
      const a = ((o = (i = r.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || [];
      for (const l of a) t.add(l.entity_id);
    }
    return t.has(e);
  }
  _isTrackedEntityInSelectedSubtree(e) {
    var i, o;
    const t = this._getSelectedSubtreeLocationIds();
    if (t.size === 0) return !1;
    for (const r of this._locations) {
      if (!t.has(r.id)) continue;
      if ((r.entity_ids || []).includes(e) || (((o = (i = r.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || []).some((l) => l.entity_id === e)) return !0;
    }
    return !1;
  }
  _getSelectedSubtreeLocationIds() {
    const e = /* @__PURE__ */ new Set();
    if (!this._selectedId) return e;
    e.add(this._selectedId);
    let t = !0;
    for (; t; ) {
      t = !1;
      for (const i of this._locations)
        i.parent_id && e.has(i.parent_id) && !e.has(i.id) && (e.add(i.id), t = !0);
    }
    return e;
  }
  _getEventLogScopeLabel() {
    if (this._eventLogScope === "all") return "all locations";
    const e = this._locations.find((i) => i.id === this._selectedId);
    if (!e) return "selected subtree";
    const t = this._getSelectedSubtreeLocationIds().size;
    return `${e.name} subtree (${t} locations)`;
  }
  _safeStringify(e) {
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
  _logEvent(e, t, i) {
    const o = {
      ts: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      type: e,
      message: t,
      data: i
    };
    this._eventLogEntries = [o, ...this._eventLogEntries].slice(0, 200);
  }
  _showKeyboardShortcutsHelp() {
    const t = [
      { key: "Ctrl+S", description: "Save pending changes" },
      { key: "Escape", description: "Discard pending changes" },
      { key: "Double-click", description: "Rename location (in tree)" },
      { key: "Drag", description: "Move location (drag handle in tree)" },
      { key: "?", description: "Show this help" }
    ].map((i) => `${i.key}: ${i.description}`).join(`
`);
    alert(`Keyboard Shortcuts:

${t}`);
  }
  _getSelectedLocation() {
    if (this._selectedId)
      return this._locations.find((e) => e.id === this._selectedId);
  }
  _isSourceAssignableLocation(e) {
    return !!e && Y(e) !== "floor";
  }
  /**
   * Batch save all pending changes
   * See: docs/frontend-patterns.md Section 13.2
   */
  async _handleSaveChanges() {
    if (this._pendingChanges.size === 0 || this._saving) return;
    this._saving = !0;
    const e = Array.from(this._pendingChanges.entries()), t = await Promise.allSettled(
      e.map(([o, r]) => this._saveChange(o, r))
    ), i = t.filter((o) => o.status === "rejected");
    i.length === 0 ? (this._pendingChanges.clear(), this._showToast("All changes saved successfully", "success")) : i.length < t.length ? (this._showToast(`Saved ${t.length - i.length} changes, ${i.length} failed`, "warning"), e.forEach(([o, r], a) => {
      t[a].status === "fulfilled" && this._pendingChanges.delete(o);
    })) : this._showToast("Failed to save changes", "error"), this._saving = !1, await this._loadLocations();
  }
  /**
   * Discard all pending changes and reload from server.
   */
  async _handleDiscardChanges() {
    this._pendingChanges.size === 0 || this._discarding || (this._discarding = !0, this._pendingChanges.clear(), await this._loadLocations(!0), this._discarding = !1);
  }
  async _saveChange(e, t) {
    switch (t.type) {
      case "update":
        await this.hass.callWS({
          type: "home_topology/locations/update",
          location_id: e,
          changes: t.updated
        });
        break;
      case "delete":
        await this.hass.callWS({
          type: "home_topology/locations/delete",
          location_id: e
        });
        break;
      case "create":
        await this.hass.callWS({
          type: "home_topology/locations/create",
          ...t.updated
        });
        break;
    }
  }
  _showToast(e, t = "success") {
    const i = new CustomEvent("hass-notification", {
      detail: {
        message: e,
        type: t === "error" ? "error" : void 0,
        duration: t === "error" ? 5e3 : 3e3
      },
      bubbles: !0,
      composed: !0
    });
    this.dispatchEvent(i), console.log(`[Toast:${t}] ${e}`);
  }
  async _seedDemoData() {
    if (!confirm("This will create a demo topology. Continue?")) return;
    const e = [
      { id: "ground_floor", name: "Ground Floor", type: "floor", parent_id: null },
      { id: "living_room", name: "Living Room", type: "area", parent_id: "ground_floor" },
      { id: "reading_corner", name: "Reading Corner", type: "area", parent_id: "living_room" },
      { id: "kitchen", name: "Kitchen", type: "area", parent_id: "ground_floor" },
      { id: "dining_room", name: "Dining Room", type: "area", parent_id: "ground_floor" },
      { id: "hallway", name: "Hallway", type: "area", parent_id: "ground_floor" },
      { id: "office", name: "Office", type: "area", parent_id: "ground_floor" },
      { id: "garage", name: "Garage", type: "area", parent_id: "ground_floor" },
      { id: "first_floor", name: "First Floor", type: "floor", parent_id: null },
      { id: "master_suite", name: "Master Suite", type: "area", parent_id: "first_floor" },
      { id: "master_bedroom", name: "Master Bedroom", type: "area", parent_id: "master_suite" },
      { id: "master_bath", name: "Master Bath", type: "area", parent_id: "master_suite" },
      { id: "kids_room", name: "Kids Room", type: "area", parent_id: "first_floor" },
      { id: "guest_room", name: "Guest Room", type: "area", parent_id: "first_floor" },
      { id: "outdoor", name: "Outdoor", type: "floor", parent_id: null },
      { id: "patio", name: "Patio", type: "area", parent_id: "outdoor" },
      { id: "garden", name: "Garden", type: "area", parent_id: "outdoor" }
    ];
    try {
      this._loading = !0;
      for (const t of e) {
        console.log(`Creating ${t.name}...`);
        try {
          await this.hass.callWS({
            type: "home_topology/locations/create",
            name: t.name,
            parent_id: t.parent_id,
            meta: { type: t.type }
          });
        } catch (i) {
          console.warn(`Failed to create ${t.name} (might exist):`, i);
        }
      }
      await this._loadLocations(), alert("Demo data seeded successfully!");
    } catch (t) {
      console.error("Seeding failed:", t), alert(`Seeding failed: ${t.message}`);
    } finally {
      this._loading = !1;
    }
  }
};
yt.properties = {
  hass: { attribute: !1 },
  narrow: { attribute: !1 },
  // Internal state
  _locations: { state: !0 },
  _locationsVersion: { state: !0 },
  _selectedId: { state: !0 },
  _loading: { state: !0 },
  _error: { state: !0 },
  _pendingChanges: { state: !0 },
  _saving: { state: !0 },
  _discarding: { state: !0 },
  _locationDialogOpen: { state: !0 },
  _addDeviceDialogOpen: { state: !0 },
  _ruleDialogOpen: { state: !0 },
  _entityConfigDialogOpen: { state: !0 },
  _editingLocation: { state: !0 },
  _editingRule: { state: !0 },
  _editingSource: { state: !0 },
  _editingSourceIndex: { state: !0 },
  _addSourcePrefillEntityId: { state: !0 },
  _addSourceRestrictToArea: { state: !0 },
  _renameConflict: { state: !0 },
  _newLocationDefaults: { state: !0 },
  _eventLogOpen: { state: !0 },
  _eventLogEntries: { state: !0 }
}, yt.styles = [
  ye,
  se`
      :host {
        display: block;
        height: 100%;
        background: var(--primary-background-color);
      }

      .panel-container {
        display: flex;
        height: 100%;
        gap: 1px;
        background: var(--divider-color);
      }

      /* Tree Panel ~40% (min 300px) - from ui-design.md Section 2.1 */
      .panel-left {
        flex: 0 0 40%;
        min-width: 300px;
        max-width: 500px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Details Panel ~60% (min 400px) */
      .panel-right {
        flex: 1;
        min-width: 400px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* Responsive - from ui-design.md Section 2.2 */
      @media (max-width: 1024px) {
        .panel-left {
          flex: 0 0 300px;
          min-width: 280px;
        }
        .panel-right {
          min-width: 300px;
        }
      }

      @media (max-width: 768px) {
        .panel-container {
          flex-direction: column;
        }

        .panel-left,
        .panel-right {
          flex: 1;
          min-width: unset;
          max-width: unset;
        }
      }

      /* Header styling - from ui-design.md Section 3.1.1 */
      .header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--divider-color);
        background: var(--card-background-color);
        flex-shrink: 0;
      }

      .header-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
      }

      .header-subtitle {
        font-size: 13px;
        color: var(--text-secondary-color);
        margin-bottom: var(--spacing-md);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .header-actions .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      /* Loading and error states */
      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .spinner {
        border: 3px solid var(--divider-color);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-container {
        padding: var(--spacing-lg);
        color: var(--error-color);
        text-align: center;
      }

      .error-container h3 {
        margin-bottom: var(--spacing-md);
      }

      .error-container p {
        margin-bottom: var(--spacing-lg);
        color: var(--text-primary-color);
      }

      /* Rename conflict notification */
      .conflict-banner {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 12px 16px;
        margin: 0 0 16px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      [data-theme="dark"] .conflict-banner {
        background: #4a3f1f;
        border-left-color: #ffc107;
      }

      .conflict-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
      }

      .conflict-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: #856404;
      }

      [data-theme="dark"] .conflict-title {
        color: #ffc107;
      }

      .conflict-message {
        color: #856404;
      }

      [data-theme="dark"] .conflict-message {
        color: #ddd;
      }

      .conflict-actions {
        display: flex;
        gap: 8px;
      }

      .conflict-actions button {
        padding: 6px 12px;
        font-size: 12px;
        white-space: nowrap;
      }

      .event-log {
        margin: 0 var(--spacing-md) var(--spacing-md);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
        overflow: hidden;
      }

      .event-log-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--divider-color);
        font-size: 12px;
        font-weight: 600;
      }

      .event-log-list {
        max-height: 220px;
        overflow: auto;
        font-family: var(--code-font-family, monospace);
        font-size: 11px;
      }

      .event-log-item {
        padding: 6px 10px;
        border-bottom: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        line-height: 1.35;
      }

      .event-log-item:last-child {
        border-bottom: none;
      }

      .event-log-meta {
        color: var(--text-secondary-color);
      }

      .event-log-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `
];
let Yt = yt;
if (!customElements.get("home-topology-panel"))
  try {
    console.log("[home-topology-panel] registering custom element"), customElements.define("home-topology-panel", Yt);
  } catch (n) {
    console.error("[home-topology-panel] failed to define element", n);
  }
export {
  Yt as HomeTopologyPanel
};
