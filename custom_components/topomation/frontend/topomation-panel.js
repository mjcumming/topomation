/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ne = globalThis, ei = ne.ShadowRoot && (ne.ShadyCSS === void 0 || ne.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ii = Symbol(), di = /* @__PURE__ */ new WeakMap();
let Hi = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== ii) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (ei && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = di.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && di.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const $o = (s) => new Hi(typeof s == "string" ? s : s + "", void 0, ii), Xt = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, o, n) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + s[n + 1], s[0]);
  return new Hi(e, s, ii);
}, ko = (s, t) => {
  if (ei) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), o = ne.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = e.cssText, s.appendChild(i);
  }
}, ui = ei ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return $o(e);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Eo, defineProperty: Ao, getOwnPropertyDescriptor: Lo, getOwnPropertyNames: To, getOwnPropertySymbols: Co, getPrototypeOf: Do } = Object, dt = globalThis, hi = dt.trustedTypes, Io = hi ? hi.emptyScript : "", ke = dt.reactiveElementPolyfillSupport, jt = (s, t) => s, Ke = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? Io : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, t) {
  let e = s;
  switch (t) {
    case Boolean:
      e = s !== null;
      break;
    case Number:
      e = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(s);
      } catch {
        e = null;
      }
  }
  return e;
} }, qi = (s, t) => !Eo(s, t), pi = { attribute: !0, type: String, converter: Ke, reflect: !1, useDefault: !1, hasChanged: qi };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), dt.litPropertyMetadata ?? (dt.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let kt = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = pi) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), o = this.getPropertyDescriptor(t, i, e);
      o !== void 0 && Ao(this.prototype, t, o);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: o, set: n } = Lo(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: o, set(a) {
      const r = o == null ? void 0 : o.call(this);
      n == null || n.call(this, a), this.requestUpdate(t, r, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? pi;
  }
  static _$Ei() {
    if (this.hasOwnProperty(jt("elementProperties"))) return;
    const t = Do(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(jt("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(jt("properties"))) {
      const e = this.properties, i = [...To(e), ...Co(e)];
      for (const o of i) this.createProperty(o, e[o]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, o] of e) this.elementProperties.set(i, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const o = this._$Eu(e, i);
      o !== void 0 && this._$Eh.set(o, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const o of i) e.unshift(ui(o));
    } else t !== void 0 && e.push(ui(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ko(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostConnected) == null ? void 0 : i.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostDisconnected) == null ? void 0 : i.call(e);
    });
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    var n;
    const i = this.constructor.elementProperties.get(t), o = this.constructor._$Eu(t, i);
    if (o !== void 0 && i.reflect === !0) {
      const a = (((n = i.converter) == null ? void 0 : n.toAttribute) !== void 0 ? i.converter : Ke).toAttribute(e, i.type);
      this._$Em = t, a == null ? this.removeAttribute(o) : this.setAttribute(o, a), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var n, a;
    const i = this.constructor, o = i._$Eh.get(t);
    if (o !== void 0 && this._$Em !== o) {
      const r = i.getPropertyOptions(o), c = typeof r.converter == "function" ? { fromAttribute: r.converter } : ((n = r.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? r.converter : Ke;
      this._$Em = o;
      const l = c.fromAttribute(e, r.type);
      this[o] = l ?? ((a = this._$Ej) == null ? void 0 : a.get(o)) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, i) {
    var o;
    if (t !== void 0) {
      const n = this.constructor, a = this[t];
      if (i ?? (i = n.getPropertyOptions(t)), !((i.hasChanged ?? qi)(a, e) || i.useDefault && i.reflect && a === ((o = this._$Ej) == null ? void 0 : o.get(t)) && !this.hasAttribute(n._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: o, wrapped: n }, a) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), n !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), o === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [n, a] of this._$Ep) this[n] = a;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [n, a] of o) {
        const { wrapped: r } = a, c = this[n];
        r !== !0 || this._$AL.has(n) || c === void 0 || this.C(n, void 0, a, c);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (i = this._$EO) == null || i.forEach((o) => {
        var n;
        return (n = o.hostUpdate) == null ? void 0 : n.call(o);
      }), this.update(e)) : this._$EM();
    } catch (o) {
      throw t = !1, this._$EM(), o;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((i) => {
      var o;
      return (o = i.hostUpdated) == null ? void 0 : o.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
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
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
kt.elementStyles = [], kt.shadowRootOptions = { mode: "open" }, kt[jt("elementProperties")] = /* @__PURE__ */ new Map(), kt[jt("finalized")] = /* @__PURE__ */ new Map(), ke == null || ke({ ReactiveElement: kt }), (dt.reactiveElementVersions ?? (dt.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const zt = globalThis, ue = zt.trustedTypes, fi = ue ? ue.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, Vi = "$lit$", st = `lit$${Math.random().toFixed(9).slice(2)}$`, Gi = "?" + st, Po = `<${Gi}>`, xt = document, Vt = () => xt.createComment(""), Gt = (s) => s === null || typeof s != "object" && typeof s != "function", oi = Array.isArray, Ro = (s) => oi(s) || typeof (s == null ? void 0 : s[Symbol.iterator]) == "function", Ee = `[ 	
\f\r]`, Ot = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, gi = /-->/g, _i = />/g, ft = RegExp(`>|${Ee}(?:([^\\s"'>=/]+)(${Ee}*=${Ee}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), mi = /'/g, vi = /"/g, Yi = /^(?:script|style|textarea|title)$/i, Oo = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), g = Oo(1), Y = Symbol.for("lit-noChange"), P = Symbol.for("lit-nothing"), yi = /* @__PURE__ */ new WeakMap(), bt = xt.createTreeWalker(xt, 129);
function Xi(s, t) {
  if (!oi(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return fi !== void 0 ? fi.createHTML(t) : t;
}
const Mo = (s, t) => {
  const e = s.length - 1, i = [];
  let o, n = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = Ot;
  for (let r = 0; r < e; r++) {
    const c = s[r];
    let l, h, d = -1, p = 0;
    for (; p < c.length && (a.lastIndex = p, h = a.exec(c), h !== null); ) p = a.lastIndex, a === Ot ? h[1] === "!--" ? a = gi : h[1] !== void 0 ? a = _i : h[2] !== void 0 ? (Yi.test(h[2]) && (o = RegExp("</" + h[2], "g")), a = ft) : h[3] !== void 0 && (a = ft) : a === ft ? h[0] === ">" ? (a = o ?? Ot, d = -1) : h[1] === void 0 ? d = -2 : (d = a.lastIndex - h[2].length, l = h[1], a = h[3] === void 0 ? ft : h[3] === '"' ? vi : mi) : a === vi || a === mi ? a = ft : a === gi || a === _i ? a = Ot : (a = ft, o = void 0);
    const f = a === ft && s[r + 1].startsWith("/>") ? " " : "";
    n += a === Ot ? c + Po : d >= 0 ? (i.push(l), c.slice(0, d) + Vi + c.slice(d) + st + f) : c + st + (d === -2 ? r : f);
  }
  return [Xi(s, n + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class Yt {
  constructor({ strings: t, _$litType$: e }, i) {
    let o;
    this.parts = [];
    let n = 0, a = 0;
    const r = t.length - 1, c = this.parts, [l, h] = Mo(t, e);
    if (this.el = Yt.createElement(l, i), bt.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (o = bt.nextNode()) !== null && c.length < r; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const d of o.getAttributeNames()) if (d.endsWith(Vi)) {
          const p = h[a++], f = o.getAttribute(d).split(st), u = /([.?@])?(.*)/.exec(p);
          c.push({ type: 1, index: n, name: u[2], strings: f, ctor: u[1] === "." ? Bo : u[1] === "?" ? Fo : u[1] === "@" ? jo : xe }), o.removeAttribute(d);
        } else d.startsWith(st) && (c.push({ type: 6, index: n }), o.removeAttribute(d));
        if (Yi.test(o.tagName)) {
          const d = o.textContent.split(st), p = d.length - 1;
          if (p > 0) {
            o.textContent = ue ? ue.emptyScript : "";
            for (let f = 0; f < p; f++) o.append(d[f], Vt()), bt.nextNode(), c.push({ type: 2, index: ++n });
            o.append(d[p], Vt());
          }
        }
      } else if (o.nodeType === 8) if (o.data === Gi) c.push({ type: 2, index: n });
      else {
        let d = -1;
        for (; (d = o.data.indexOf(st, d + 1)) !== -1; ) c.push({ type: 7, index: n }), d += st.length - 1;
      }
      n++;
    }
  }
  static createElement(t, e) {
    const i = xt.createElement("template");
    return i.innerHTML = t, i;
  }
}
function Tt(s, t, e = s, i) {
  var a, r;
  if (t === Y) return t;
  let o = i !== void 0 ? (a = e._$Co) == null ? void 0 : a[i] : e._$Cl;
  const n = Gt(t) ? void 0 : t._$litDirective$;
  return (o == null ? void 0 : o.constructor) !== n && ((r = o == null ? void 0 : o._$AO) == null || r.call(o, !1), n === void 0 ? o = void 0 : (o = new n(s), o._$AT(s, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = o : e._$Cl = o), o !== void 0 && (t = Tt(s, o._$AS(s, t.values), o, i)), t;
}
let No = class {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, o = ((t == null ? void 0 : t.creationScope) ?? xt).importNode(e, !0);
    bt.currentNode = o;
    let n = bt.nextNode(), a = 0, r = 0, c = i[0];
    for (; c !== void 0; ) {
      if (a === c.index) {
        let l;
        c.type === 2 ? l = new Dt(n, n.nextSibling, this, t) : c.type === 1 ? l = new c.ctor(n, c.name, c.strings, this, t) : c.type === 6 && (l = new zo(n, this, t)), this._$AV.push(l), c = i[++r];
      }
      a !== (c == null ? void 0 : c.index) && (n = bt.nextNode(), a++);
    }
    return bt.currentNode = xt, o;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
};
class Dt {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, o) {
    this.type = 2, this._$AH = P, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = o, this._$Cv = (o == null ? void 0 : o.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = Tt(this, t, e), Gt(t) ? t === P || t == null || t === "" ? (this._$AH !== P && this._$AR(), this._$AH = P) : t !== this._$AH && t !== Y && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Ro(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== P && Gt(this._$AH) ? this._$AA.nextSibling.data = t : this.T(xt.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var n;
    const { values: e, _$litType$: i } = t, o = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = Yt.createElement(Xi(i.h, i.h[0]), this.options)), i);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === o) this._$AH.p(e);
    else {
      const a = new No(o, this), r = a.u(this.options);
      a.p(e), this.T(r), this._$AH = a;
    }
  }
  _$AC(t) {
    let e = yi.get(t.strings);
    return e === void 0 && yi.set(t.strings, e = new Yt(t)), e;
  }
  k(t) {
    oi(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, o = 0;
    for (const n of t) o === e.length ? e.push(i = new Dt(this.O(Vt()), this.O(Vt()), this, this.options)) : i = e[o], i._$AI(n), o++;
    o < e.length && (this._$AR(i && i._$AB.nextSibling, o), e.length = o);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, e); t !== this._$AB; ) {
      const o = t.nextSibling;
      t.remove(), t = o;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class xe {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, o, n) {
    this.type = 1, this._$AH = P, this._$AN = void 0, this.element = t, this.name = e, this._$AM = o, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = P;
  }
  _$AI(t, e = this, i, o) {
    const n = this.strings;
    let a = !1;
    if (n === void 0) t = Tt(this, t, e, 0), a = !Gt(t) || t !== this._$AH && t !== Y, a && (this._$AH = t);
    else {
      const r = t;
      let c, l;
      for (t = n[0], c = 0; c < n.length - 1; c++) l = Tt(this, r[i + c], e, c), l === Y && (l = this._$AH[c]), a || (a = !Gt(l) || l !== this._$AH[c]), l === P ? t = P : t !== P && (t += (l ?? "") + n[c + 1]), this._$AH[c] = l;
    }
    a && !o && this.j(t);
  }
  j(t) {
    t === P ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Bo extends xe {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === P ? void 0 : t;
  }
}
class Fo extends xe {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== P);
  }
}
class jo extends xe {
  constructor(t, e, i, o, n) {
    super(t, e, i, o, n), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = Tt(this, t, e, 0) ?? P) === Y) return;
    const i = this._$AH, o = t === P && i !== P || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, n = t !== P && (i === P || o);
    o && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class zo {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    Tt(this, t);
  }
}
const Uo = { I: Dt }, Ae = zt.litHtmlPolyfillSupport;
Ae == null || Ae(Yt, Dt), (zt.litHtmlVersions ?? (zt.litHtmlVersions = [])).push("3.3.1");
const Wo = (s, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let o = i._$litPart$;
  if (o === void 0) {
    const n = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = o = new Dt(t.insertBefore(Vt(), n), n, void 0, e ?? {});
  }
  return o._$AI(s), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const wt = globalThis;
let ut = class extends kt {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Wo(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return Y;
  }
};
var Bi;
ut._$litElement$ = !0, ut.finalized = !0, (Bi = wt.litElementHydrateSupport) == null || Bi.call(wt, { LitElement: ut });
const Le = wt.litElementPolyfillSupport;
Le == null || Le({ LitElement: ut });
(wt.litElementVersions ?? (wt.litElementVersions = [])).push("4.2.1");
const Se = Xt`
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

  .empty-state-message {
    margin-bottom: var(--spacing-md);
    max-width: 280px;
    margin-left: auto;
    margin-right: auto;
  }

  .empty-state-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: inherit;
  }
`, Ko = {
  room: "area"
}, Qi = /* @__PURE__ */ new Set(["building", "grounds"]);
function Ho(s) {
  const t = String(s ?? "area").trim().toLowerCase(), e = Ko[t] ?? t;
  return e === "floor" || e === "area" || e === "building" || e === "grounds" || e === "subarea" ? e : "area";
}
function B(s) {
  var t, e;
  return Ho((e = (t = s.modules) == null ? void 0 : t._meta) == null ? void 0 : e.type);
}
function He(s) {
  return s === "floor" ? ["root", "building"] : Qi.has(s) ? ["root"] : s === "subarea" ? ["root", "floor", "area", "subarea", "building", "grounds"] : ["root", "floor", "area", "building", "grounds"];
}
function qo(s, t) {
  return He(s).includes(t);
}
function Vo(s) {
  var c;
  const { locations: t, locationId: e, newParentId: i } = s;
  if (i === e || i && qe(t, e, i)) return !1;
  const o = new Map(t.map((l) => [l.id, l])), n = o.get(e);
  if (!n || i && !o.get(i) || i && ((c = o.get(i)) != null && c.is_explicit_root)) return !1;
  const a = B(n);
  if (Qi.has(a))
    return i === null;
  const r = i === null ? "root" : B(o.get(i) ?? {});
  return !!qo(a, r);
}
function qe(s, t, e) {
  if (t === e) return !1;
  const i = new Map(s.map((a) => [a.id, a]));
  let o = i.get(e);
  const n = /* @__PURE__ */ new Set();
  for (; o != null && o.parent_id; ) {
    if (o.parent_id === t || n.has(o.parent_id)) return !0;
    n.add(o.parent_id), o = i.get(o.parent_id);
  }
  return !1;
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const vt = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4 }, Ji = (s) => (...t) => ({ _$litDirective$: s, values: t });
class Zi {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, e, i) {
    this._$Ct = t, this._$AM = e, this._$Ci = i;
  }
  _$AS(t, e) {
    return this.update(t, e);
  }
  update(t, e) {
    return this.render(...e);
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { I: Go } = Uo, Yo = (s) => s.strings === void 0, bi = () => document.createComment(""), Mt = (s, t, e) => {
  var n;
  const i = s._$AA.parentNode, o = t === void 0 ? s._$AB : t._$AA;
  if (e === void 0) {
    const a = i.insertBefore(bi(), o), r = i.insertBefore(bi(), o);
    e = new Go(a, r, s, s.options);
  } else {
    const a = e._$AB.nextSibling, r = e._$AM, c = r !== s;
    if (c) {
      let l;
      (n = e._$AQ) == null || n.call(e, s), e._$AM = s, e._$AP !== void 0 && (l = s._$AU) !== r._$AU && e._$AP(l);
    }
    if (a !== o || c) {
      let l = e._$AA;
      for (; l !== a; ) {
        const h = l.nextSibling;
        i.insertBefore(l, o), l = h;
      }
    }
  }
  return e;
}, gt = (s, t, e = s) => (s._$AI(t, e), s), Xo = {}, to = (s, t = Xo) => s._$AH = t, Qo = (s) => s._$AH, Te = (s) => {
  s._$AR(), s._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const wi = (s, t, e) => {
  const i = /* @__PURE__ */ new Map();
  for (let o = t; o <= e; o++) i.set(s[o], o);
  return i;
}, ae = Ji(class extends Zi {
  constructor(s) {
    if (super(s), s.type !== vt.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(s, t, e) {
    let i;
    e === void 0 ? e = t : t !== void 0 && (i = t);
    const o = [], n = [];
    let a = 0;
    for (const r of s) o[a] = i ? i(r, a) : a, n[a] = e(r, a), a++;
    return { values: n, keys: o };
  }
  render(s, t, e) {
    return this.dt(s, t, e).values;
  }
  update(s, [t, e, i]) {
    const o = Qo(s), { values: n, keys: a } = this.dt(t, e, i);
    if (!Array.isArray(o)) return this.ut = a, n;
    const r = this.ut ?? (this.ut = []), c = [];
    let l, h, d = 0, p = o.length - 1, f = 0, u = n.length - 1;
    for (; d <= p && f <= u; ) if (o[d] === null) d++;
    else if (o[p] === null) p--;
    else if (r[d] === a[f]) c[f] = gt(o[d], n[f]), d++, f++;
    else if (r[p] === a[u]) c[u] = gt(o[p], n[u]), p--, u--;
    else if (r[d] === a[u]) c[u] = gt(o[d], n[u]), Mt(s, c[u + 1], o[d]), d++, u--;
    else if (r[p] === a[f]) c[f] = gt(o[p], n[f]), Mt(s, o[d], o[p]), p--, f++;
    else if (l === void 0 && (l = wi(a, f, u), h = wi(r, d, p)), l.has(r[d])) if (l.has(r[p])) {
      const _ = h.get(a[f]), v = _ !== void 0 ? o[_] : null;
      if (v === null) {
        const y = Mt(s, o[d]);
        gt(y, n[f]), c[f] = y;
      } else c[f] = gt(v, n[f]), Mt(s, o[d], v), o[_] = null;
      f++;
    } else Te(o[p]), p--;
    else Te(o[d]), d++;
    for (; f <= u; ) {
      const _ = Mt(s, c[u + 1]);
      gt(_, n[f]), c[f++] = _;
    }
    for (; d <= p; ) {
      const _ = o[d++];
      _ !== null && Te(_);
    }
    return this.ut = a, to(s, c), Y;
  }
});
/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function xi(s, t) {
  var e = Object.keys(s);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(s);
    t && (i = i.filter(function(o) {
      return Object.getOwnPropertyDescriptor(s, o).enumerable;
    })), e.push.apply(e, i);
  }
  return e;
}
function J(s) {
  for (var t = 1; t < arguments.length; t++) {
    var e = arguments[t] != null ? arguments[t] : {};
    t % 2 ? xi(Object(e), !0).forEach(function(i) {
      Jo(s, i, e[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(s, Object.getOwnPropertyDescriptors(e)) : xi(Object(e)).forEach(function(i) {
      Object.defineProperty(s, i, Object.getOwnPropertyDescriptor(e, i));
    });
  }
  return s;
}
function se(s) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? se = function(t) {
    return typeof t;
  } : se = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, se(s);
}
function Jo(s, t, e) {
  return t in s ? Object.defineProperty(s, t, {
    value: e,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : s[t] = e, s;
}
function et() {
  return et = Object.assign || function(s) {
    for (var t = 1; t < arguments.length; t++) {
      var e = arguments[t];
      for (var i in e)
        Object.prototype.hasOwnProperty.call(e, i) && (s[i] = e[i]);
    }
    return s;
  }, et.apply(this, arguments);
}
function Zo(s, t) {
  if (s == null) return {};
  var e = {}, i = Object.keys(s), o, n;
  for (n = 0; n < i.length; n++)
    o = i[n], !(t.indexOf(o) >= 0) && (e[o] = s[o]);
  return e;
}
function tn(s, t) {
  if (s == null) return {};
  var e = Zo(s, t), i, o;
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(s);
    for (o = 0; o < n.length; o++)
      i = n[o], !(t.indexOf(i) >= 0) && Object.prototype.propertyIsEnumerable.call(s, i) && (e[i] = s[i]);
  }
  return e;
}
var en = "1.15.6";
function tt(s) {
  if (typeof window < "u" && window.navigator)
    return !!/* @__PURE__ */ navigator.userAgent.match(s);
}
var it = tt(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i), Qt = tt(/Edge/i), Si = tt(/firefox/i), Ut = tt(/safari/i) && !tt(/chrome/i) && !tt(/android/i), ni = tt(/iP(ad|od|hone)/i), eo = tt(/chrome/i) && tt(/android/i), io = {
  capture: !1,
  passive: !1
};
function E(s, t, e) {
  s.addEventListener(t, e, !it && io);
}
function k(s, t, e) {
  s.removeEventListener(t, e, !it && io);
}
function he(s, t) {
  if (t) {
    if (t[0] === ">" && (t = t.substring(1)), s)
      try {
        if (s.matches)
          return s.matches(t);
        if (s.msMatchesSelector)
          return s.msMatchesSelector(t);
        if (s.webkitMatchesSelector)
          return s.webkitMatchesSelector(t);
      } catch {
        return !1;
      }
    return !1;
  }
}
function oo(s) {
  return s.host && s !== document && s.host.nodeType ? s.host : s.parentNode;
}
function G(s, t, e, i) {
  if (s) {
    e = e || document;
    do {
      if (t != null && (t[0] === ">" ? s.parentNode === e && he(s, t) : he(s, t)) || i && s === e)
        return s;
      if (s === e) break;
    } while (s = oo(s));
  }
  return null;
}
var $i = /\s+/g;
function K(s, t, e) {
  if (s && t)
    if (s.classList)
      s.classList[e ? "add" : "remove"](t);
    else {
      var i = (" " + s.className + " ").replace($i, " ").replace(" " + t + " ", " ");
      s.className = (i + (e ? " " + t : "")).replace($i, " ");
    }
}
function b(s, t, e) {
  var i = s && s.style;
  if (i) {
    if (e === void 0)
      return document.defaultView && document.defaultView.getComputedStyle ? e = document.defaultView.getComputedStyle(s, "") : s.currentStyle && (e = s.currentStyle), t === void 0 ? e : e[t];
    !(t in i) && t.indexOf("webkit") === -1 && (t = "-webkit-" + t), i[t] = e + (typeof e == "string" ? "" : "px");
  }
}
function Lt(s, t) {
  var e = "";
  if (typeof s == "string")
    e = s;
  else
    do {
      var i = b(s, "transform");
      i && i !== "none" && (e = i + " " + e);
    } while (!t && (s = s.parentNode));
  var o = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return o && new o(e);
}
function no(s, t, e) {
  if (s) {
    var i = s.getElementsByTagName(t), o = 0, n = i.length;
    if (e)
      for (; o < n; o++)
        e(i[o], o);
    return i;
  }
  return [];
}
function Q() {
  var s = document.scrollingElement;
  return s || document.documentElement;
}
function I(s, t, e, i, o) {
  if (!(!s.getBoundingClientRect && s !== window)) {
    var n, a, r, c, l, h, d;
    if (s !== window && s.parentNode && s !== Q() ? (n = s.getBoundingClientRect(), a = n.top, r = n.left, c = n.bottom, l = n.right, h = n.height, d = n.width) : (a = 0, r = 0, c = window.innerHeight, l = window.innerWidth, h = window.innerHeight, d = window.innerWidth), (t || e) && s !== window && (o = o || s.parentNode, !it))
      do
        if (o && o.getBoundingClientRect && (b(o, "transform") !== "none" || e && b(o, "position") !== "static")) {
          var p = o.getBoundingClientRect();
          a -= p.top + parseInt(b(o, "border-top-width")), r -= p.left + parseInt(b(o, "border-left-width")), c = a + n.height, l = r + n.width;
          break;
        }
      while (o = o.parentNode);
    if (i && s !== window) {
      var f = Lt(o || s), u = f && f.a, _ = f && f.d;
      f && (a /= _, r /= u, d /= u, h /= _, c = a + h, l = r + d);
    }
    return {
      top: a,
      left: r,
      bottom: c,
      right: l,
      width: d,
      height: h
    };
  }
}
function ki(s, t, e) {
  for (var i = lt(s, !0), o = I(s)[t]; i; ) {
    var n = I(i)[e], a = void 0;
    if (a = o >= n, !a) return i;
    if (i === Q()) break;
    i = lt(i, !1);
  }
  return !1;
}
function Ct(s, t, e, i) {
  for (var o = 0, n = 0, a = s.children; n < a.length; ) {
    if (a[n].style.display !== "none" && a[n] !== w.ghost && (i || a[n] !== w.dragged) && G(a[n], e.draggable, s, !1)) {
      if (o === t)
        return a[n];
      o++;
    }
    n++;
  }
  return null;
}
function ai(s, t) {
  for (var e = s.lastElementChild; e && (e === w.ghost || b(e, "display") === "none" || t && !he(e, t)); )
    e = e.previousElementSibling;
  return e || null;
}
function q(s, t) {
  var e = 0;
  if (!s || !s.parentNode)
    return -1;
  for (; s = s.previousElementSibling; )
    s.nodeName.toUpperCase() !== "TEMPLATE" && s !== w.clone && (!t || he(s, t)) && e++;
  return e;
}
function Ei(s) {
  var t = 0, e = 0, i = Q();
  if (s)
    do {
      var o = Lt(s), n = o.a, a = o.d;
      t += s.scrollLeft * n, e += s.scrollTop * a;
    } while (s !== i && (s = s.parentNode));
  return [t, e];
}
function on(s, t) {
  for (var e in s)
    if (s.hasOwnProperty(e)) {
      for (var i in t)
        if (t.hasOwnProperty(i) && t[i] === s[e][i]) return Number(e);
    }
  return -1;
}
function lt(s, t) {
  if (!s || !s.getBoundingClientRect) return Q();
  var e = s, i = !1;
  do
    if (e.clientWidth < e.scrollWidth || e.clientHeight < e.scrollHeight) {
      var o = b(e);
      if (e.clientWidth < e.scrollWidth && (o.overflowX == "auto" || o.overflowX == "scroll") || e.clientHeight < e.scrollHeight && (o.overflowY == "auto" || o.overflowY == "scroll")) {
        if (!e.getBoundingClientRect || e === document.body) return Q();
        if (i || t) return e;
        i = !0;
      }
    }
  while (e = e.parentNode);
  return Q();
}
function nn(s, t) {
  if (s && t)
    for (var e in t)
      t.hasOwnProperty(e) && (s[e] = t[e]);
  return s;
}
function Ce(s, t) {
  return Math.round(s.top) === Math.round(t.top) && Math.round(s.left) === Math.round(t.left) && Math.round(s.height) === Math.round(t.height) && Math.round(s.width) === Math.round(t.width);
}
var Wt;
function ao(s, t) {
  return function() {
    if (!Wt) {
      var e = arguments, i = this;
      e.length === 1 ? s.call(i, e[0]) : s.apply(i, e), Wt = setTimeout(function() {
        Wt = void 0;
      }, t);
    }
  };
}
function an() {
  clearTimeout(Wt), Wt = void 0;
}
function so(s, t, e) {
  s.scrollLeft += t, s.scrollTop += e;
}
function ro(s) {
  var t = window.Polymer, e = window.jQuery || window.Zepto;
  return t && t.dom ? t.dom(s).cloneNode(!0) : e ? e(s).clone(!0)[0] : s.cloneNode(!0);
}
function co(s, t, e) {
  var i = {};
  return Array.from(s.children).forEach(function(o) {
    var n, a, r, c;
    if (!(!G(o, t.draggable, s, !1) || o.animated || o === e)) {
      var l = I(o);
      i.left = Math.min((n = i.left) !== null && n !== void 0 ? n : 1 / 0, l.left), i.top = Math.min((a = i.top) !== null && a !== void 0 ? a : 1 / 0, l.top), i.right = Math.max((r = i.right) !== null && r !== void 0 ? r : -1 / 0, l.right), i.bottom = Math.max((c = i.bottom) !== null && c !== void 0 ? c : -1 / 0, l.bottom);
    }
  }), i.width = i.right - i.left, i.height = i.bottom - i.top, i.x = i.left, i.y = i.top, i;
}
var W = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
function sn() {
  var s = [], t;
  return {
    captureAnimationState: function() {
      if (s = [], !!this.options.animation) {
        var i = [].slice.call(this.el.children);
        i.forEach(function(o) {
          if (!(b(o, "display") === "none" || o === w.ghost)) {
            s.push({
              target: o,
              rect: I(o)
            });
            var n = J({}, s[s.length - 1].rect);
            if (o.thisAnimationDuration) {
              var a = Lt(o, !0);
              a && (n.top -= a.f, n.left -= a.e);
            }
            o.fromRect = n;
          }
        });
      }
    },
    addAnimationState: function(i) {
      s.push(i);
    },
    removeAnimationState: function(i) {
      s.splice(on(s, {
        target: i
      }), 1);
    },
    animateAll: function(i) {
      var o = this;
      if (!this.options.animation) {
        clearTimeout(t), typeof i == "function" && i();
        return;
      }
      var n = !1, a = 0;
      s.forEach(function(r) {
        var c = 0, l = r.target, h = l.fromRect, d = I(l), p = l.prevFromRect, f = l.prevToRect, u = r.rect, _ = Lt(l, !0);
        _ && (d.top -= _.f, d.left -= _.e), l.toRect = d, l.thisAnimationDuration && Ce(p, d) && !Ce(h, d) && // Make sure animatingRect is on line between toRect & fromRect
        (u.top - d.top) / (u.left - d.left) === (h.top - d.top) / (h.left - d.left) && (c = cn(u, p, f, o.options)), Ce(d, h) || (l.prevFromRect = h, l.prevToRect = d, c || (c = o.options.animation), o.animate(l, u, d, c)), c && (n = !0, a = Math.max(a, c), clearTimeout(l.animationResetTimer), l.animationResetTimer = setTimeout(function() {
          l.animationTime = 0, l.prevFromRect = null, l.fromRect = null, l.prevToRect = null, l.thisAnimationDuration = null;
        }, c), l.thisAnimationDuration = c);
      }), clearTimeout(t), n ? t = setTimeout(function() {
        typeof i == "function" && i();
      }, a) : typeof i == "function" && i(), s = [];
    },
    animate: function(i, o, n, a) {
      if (a) {
        b(i, "transition", ""), b(i, "transform", "");
        var r = Lt(this.el), c = r && r.a, l = r && r.d, h = (o.left - n.left) / (c || 1), d = (o.top - n.top) / (l || 1);
        i.animatingX = !!h, i.animatingY = !!d, b(i, "transform", "translate3d(" + h + "px," + d + "px,0)"), this.forRepaintDummy = rn(i), b(i, "transition", "transform " + a + "ms" + (this.options.easing ? " " + this.options.easing : "")), b(i, "transform", "translate3d(0,0,0)"), typeof i.animated == "number" && clearTimeout(i.animated), i.animated = setTimeout(function() {
          b(i, "transition", ""), b(i, "transform", ""), i.animated = !1, i.animatingX = !1, i.animatingY = !1;
        }, a);
      }
    }
  };
}
function rn(s) {
  return s.offsetWidth;
}
function cn(s, t, e, i) {
  return Math.sqrt(Math.pow(t.top - s.top, 2) + Math.pow(t.left - s.left, 2)) / Math.sqrt(Math.pow(t.top - e.top, 2) + Math.pow(t.left - e.left, 2)) * i.animation;
}
var St = [], De = {
  initializeByDefault: !0
}, Jt = {
  mount: function(t) {
    for (var e in De)
      De.hasOwnProperty(e) && !(e in t) && (t[e] = De[e]);
    St.forEach(function(i) {
      if (i.pluginName === t.pluginName)
        throw "Sortable: Cannot mount plugin ".concat(t.pluginName, " more than once");
    }), St.push(t);
  },
  pluginEvent: function(t, e, i) {
    var o = this;
    this.eventCanceled = !1, i.cancel = function() {
      o.eventCanceled = !0;
    };
    var n = t + "Global";
    St.forEach(function(a) {
      e[a.pluginName] && (e[a.pluginName][n] && e[a.pluginName][n](J({
        sortable: e
      }, i)), e.options[a.pluginName] && e[a.pluginName][t] && e[a.pluginName][t](J({
        sortable: e
      }, i)));
    });
  },
  initializePlugins: function(t, e, i, o) {
    St.forEach(function(r) {
      var c = r.pluginName;
      if (!(!t.options[c] && !r.initializeByDefault)) {
        var l = new r(t, e, t.options);
        l.sortable = t, l.options = t.options, t[c] = l, et(i, l.defaults);
      }
    });
    for (var n in t.options)
      if (t.options.hasOwnProperty(n)) {
        var a = this.modifyOption(t, n, t.options[n]);
        typeof a < "u" && (t.options[n] = a);
      }
  },
  getEventProperties: function(t, e) {
    var i = {};
    return St.forEach(function(o) {
      typeof o.eventProperties == "function" && et(i, o.eventProperties.call(e[o.pluginName], t));
    }), i;
  },
  modifyOption: function(t, e, i) {
    var o;
    return St.forEach(function(n) {
      t[n.pluginName] && n.optionListeners && typeof n.optionListeners[e] == "function" && (o = n.optionListeners[e].call(t[n.pluginName], i));
    }), o;
  }
};
function ln(s) {
  var t = s.sortable, e = s.rootEl, i = s.name, o = s.targetEl, n = s.cloneEl, a = s.toEl, r = s.fromEl, c = s.oldIndex, l = s.newIndex, h = s.oldDraggableIndex, d = s.newDraggableIndex, p = s.originalEvent, f = s.putSortable, u = s.extraEventProperties;
  if (t = t || e && e[W], !!t) {
    var _, v = t.options, y = "on" + i.charAt(0).toUpperCase() + i.substr(1);
    window.CustomEvent && !it && !Qt ? _ = new CustomEvent(i, {
      bubbles: !0,
      cancelable: !0
    }) : (_ = document.createEvent("Event"), _.initEvent(i, !0, !0)), _.to = a || e, _.from = r || e, _.item = o || e, _.clone = n, _.oldIndex = c, _.newIndex = l, _.oldDraggableIndex = h, _.newDraggableIndex = d, _.originalEvent = p, _.pullMode = f ? f.lastPutMode : void 0;
    var $ = J(J({}, u), Jt.getEventProperties(i, t));
    for (var A in $)
      _[A] = $[A];
    e && e.dispatchEvent(_), v[y] && v[y].call(t, _);
  }
}
var dn = ["evt"], U = function(t, e) {
  var i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, o = i.evt, n = tn(i, dn);
  Jt.pluginEvent.bind(w)(t, e, J({
    dragEl: m,
    parentEl: C,
    ghostEl: x,
    rootEl: L,
    nextEl: yt,
    lastDownEl: re,
    cloneEl: T,
    cloneHidden: rt,
    dragStarted: Nt,
    putSortable: R,
    activeSortable: w.active,
    originalEvent: o,
    oldIndex: At,
    oldDraggableIndex: Kt,
    newIndex: H,
    newDraggableIndex: at,
    hideGhostForTarget: po,
    unhideGhostForTarget: fo,
    cloneNowHidden: function() {
      rt = !0;
    },
    cloneNowShown: function() {
      rt = !1;
    },
    dispatchSortableEvent: function(r) {
      z({
        sortable: e,
        name: r,
        originalEvent: o
      });
    }
  }, n));
};
function z(s) {
  ln(J({
    putSortable: R,
    cloneEl: T,
    targetEl: m,
    rootEl: L,
    oldIndex: At,
    oldDraggableIndex: Kt,
    newIndex: H,
    newDraggableIndex: at
  }, s));
}
var m, C, x, L, yt, re, T, rt, At, H, Kt, at, te, R, Et = !1, pe = !1, fe = [], _t, V, Ie, Pe, Ai, Li, Nt, $t, Ht, qt = !1, ee = !1, ce, N, Re = [], Ve = !1, ge = [], $e = typeof document < "u", ie = ni, Ti = Qt || it ? "cssFloat" : "float", un = $e && !eo && !ni && "draggable" in document.createElement("div"), lo = function() {
  if ($e) {
    if (it)
      return !1;
    var s = document.createElement("x");
    return s.style.cssText = "pointer-events:auto", s.style.pointerEvents === "auto";
  }
}(), uo = function(t, e) {
  var i = b(t), o = parseInt(i.width) - parseInt(i.paddingLeft) - parseInt(i.paddingRight) - parseInt(i.borderLeftWidth) - parseInt(i.borderRightWidth), n = Ct(t, 0, e), a = Ct(t, 1, e), r = n && b(n), c = a && b(a), l = r && parseInt(r.marginLeft) + parseInt(r.marginRight) + I(n).width, h = c && parseInt(c.marginLeft) + parseInt(c.marginRight) + I(a).width;
  if (i.display === "flex")
    return i.flexDirection === "column" || i.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  if (i.display === "grid")
    return i.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  if (n && r.float && r.float !== "none") {
    var d = r.float === "left" ? "left" : "right";
    return a && (c.clear === "both" || c.clear === d) ? "vertical" : "horizontal";
  }
  return n && (r.display === "block" || r.display === "flex" || r.display === "table" || r.display === "grid" || l >= o && i[Ti] === "none" || a && i[Ti] === "none" && l + h > o) ? "vertical" : "horizontal";
}, hn = function(t, e, i) {
  var o = i ? t.left : t.top, n = i ? t.right : t.bottom, a = i ? t.width : t.height, r = i ? e.left : e.top, c = i ? e.right : e.bottom, l = i ? e.width : e.height;
  return o === r || n === c || o + a / 2 === r + l / 2;
}, pn = function(t, e) {
  var i;
  return fe.some(function(o) {
    var n = o[W].options.emptyInsertThreshold;
    if (!(!n || ai(o))) {
      var a = I(o), r = t >= a.left - n && t <= a.right + n, c = e >= a.top - n && e <= a.bottom + n;
      if (r && c)
        return i = o;
    }
  }), i;
}, ho = function(t) {
  function e(n, a) {
    return function(r, c, l, h) {
      var d = r.options.group.name && c.options.group.name && r.options.group.name === c.options.group.name;
      if (n == null && (a || d))
        return !0;
      if (n == null || n === !1)
        return !1;
      if (a && n === "clone")
        return n;
      if (typeof n == "function")
        return e(n(r, c, l, h), a)(r, c, l, h);
      var p = (a ? r : c).options.group.name;
      return n === !0 || typeof n == "string" && n === p || n.join && n.indexOf(p) > -1;
    };
  }
  var i = {}, o = t.group;
  (!o || se(o) != "object") && (o = {
    name: o
  }), i.name = o.name, i.checkPull = e(o.pull, !0), i.checkPut = e(o.put), i.revertClone = o.revertClone, t.group = i;
}, po = function() {
  !lo && x && b(x, "display", "none");
}, fo = function() {
  !lo && x && b(x, "display", "");
};
$e && !eo && document.addEventListener("click", function(s) {
  if (pe)
    return s.preventDefault(), s.stopPropagation && s.stopPropagation(), s.stopImmediatePropagation && s.stopImmediatePropagation(), pe = !1, !1;
}, !0);
var mt = function(t) {
  if (m) {
    t = t.touches ? t.touches[0] : t;
    var e = pn(t.clientX, t.clientY);
    if (e) {
      var i = {};
      for (var o in t)
        t.hasOwnProperty(o) && (i[o] = t[o]);
      i.target = i.rootEl = e, i.preventDefault = void 0, i.stopPropagation = void 0, e[W]._onDragOver(i);
    }
  }
}, fn = function(t) {
  m && m.parentNode[W]._isOutsideThisEl(t.target);
};
function w(s, t) {
  if (!(s && s.nodeType && s.nodeType === 1))
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(s));
  this.el = s, this.options = t = et({}, t), s[W] = this;
  var e = {
    group: null,
    sort: !0,
    disabled: !1,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(s.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: !1,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: !0,
    direction: function() {
      return uo(s, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: !0,
    animation: 0,
    easing: null,
    setData: function(a, r) {
      a.setData("Text", r.textContent);
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
    supportPointer: w.supportPointer !== !1 && "PointerEvent" in window && (!Ut || ni),
    emptyInsertThreshold: 5
  };
  Jt.initializePlugins(this, s, e);
  for (var i in e)
    !(i in t) && (t[i] = e[i]);
  ho(t);
  for (var o in this)
    o.charAt(0) === "_" && typeof this[o] == "function" && (this[o] = this[o].bind(this));
  this.nativeDraggable = t.forceFallback ? !1 : un, this.nativeDraggable && (this.options.touchStartThreshold = 1), t.supportPointer ? E(s, "pointerdown", this._onTapStart) : (E(s, "mousedown", this._onTapStart), E(s, "touchstart", this._onTapStart)), this.nativeDraggable && (E(s, "dragover", this), E(s, "dragenter", this)), fe.push(this.el), t.store && t.store.get && this.sort(t.store.get(this) || []), et(this, sn());
}
w.prototype = /** @lends Sortable.prototype */
{
  constructor: w,
  _isOutsideThisEl: function(t) {
    !this.el.contains(t) && t !== this.el && ($t = null);
  },
  _getDirection: function(t, e) {
    return typeof this.options.direction == "function" ? this.options.direction.call(this, t, e, m) : this.options.direction;
  },
  _onTapStart: function(t) {
    if (t.cancelable) {
      var e = this, i = this.el, o = this.options, n = o.preventOnFilter, a = t.type, r = t.touches && t.touches[0] || t.pointerType && t.pointerType === "touch" && t, c = (r || t).target, l = t.target.shadowRoot && (t.path && t.path[0] || t.composedPath && t.composedPath()[0]) || c, h = o.filter;
      if (xn(i), !m && !(/mousedown|pointerdown/.test(a) && t.button !== 0 || o.disabled) && !l.isContentEditable && !(!this.nativeDraggable && Ut && c && c.tagName.toUpperCase() === "SELECT") && (c = G(c, o.draggable, i, !1), !(c && c.animated) && re !== c)) {
        if (At = q(c), Kt = q(c, o.draggable), typeof h == "function") {
          if (h.call(this, t, c, this)) {
            z({
              sortable: e,
              rootEl: l,
              name: "filter",
              targetEl: c,
              toEl: i,
              fromEl: i
            }), U("filter", e, {
              evt: t
            }), n && t.preventDefault();
            return;
          }
        } else if (h && (h = h.split(",").some(function(d) {
          if (d = G(l, d.trim(), i, !1), d)
            return z({
              sortable: e,
              rootEl: d,
              name: "filter",
              targetEl: c,
              fromEl: i,
              toEl: i
            }), U("filter", e, {
              evt: t
            }), !0;
        }), h)) {
          n && t.preventDefault();
          return;
        }
        o.handle && !G(l, o.handle, i, !1) || this._prepareDragStart(t, r, c);
      }
    }
  },
  _prepareDragStart: function(t, e, i) {
    var o = this, n = o.el, a = o.options, r = n.ownerDocument, c;
    if (i && !m && i.parentNode === n) {
      var l = I(i);
      if (L = n, m = i, C = m.parentNode, yt = m.nextSibling, re = i, te = a.group, w.dragged = m, _t = {
        target: m,
        clientX: (e || t).clientX,
        clientY: (e || t).clientY
      }, Ai = _t.clientX - l.left, Li = _t.clientY - l.top, this._lastX = (e || t).clientX, this._lastY = (e || t).clientY, m.style["will-change"] = "all", c = function() {
        if (U("delayEnded", o, {
          evt: t
        }), w.eventCanceled) {
          o._onDrop();
          return;
        }
        o._disableDelayedDragEvents(), !Si && o.nativeDraggable && (m.draggable = !0), o._triggerDragStart(t, e), z({
          sortable: o,
          name: "choose",
          originalEvent: t
        }), K(m, a.chosenClass, !0);
      }, a.ignore.split(",").forEach(function(h) {
        no(m, h.trim(), Oe);
      }), E(r, "dragover", mt), E(r, "mousemove", mt), E(r, "touchmove", mt), a.supportPointer ? (E(r, "pointerup", o._onDrop), !this.nativeDraggable && E(r, "pointercancel", o._onDrop)) : (E(r, "mouseup", o._onDrop), E(r, "touchend", o._onDrop), E(r, "touchcancel", o._onDrop)), Si && this.nativeDraggable && (this.options.touchStartThreshold = 4, m.draggable = !0), U("delayStart", this, {
        evt: t
      }), a.delay && (!a.delayOnTouchOnly || e) && (!this.nativeDraggable || !(Qt || it))) {
        if (w.eventCanceled) {
          this._onDrop();
          return;
        }
        a.supportPointer ? (E(r, "pointerup", o._disableDelayedDrag), E(r, "pointercancel", o._disableDelayedDrag)) : (E(r, "mouseup", o._disableDelayedDrag), E(r, "touchend", o._disableDelayedDrag), E(r, "touchcancel", o._disableDelayedDrag)), E(r, "mousemove", o._delayedDragTouchMoveHandler), E(r, "touchmove", o._delayedDragTouchMoveHandler), a.supportPointer && E(r, "pointermove", o._delayedDragTouchMoveHandler), o._dragStartTimer = setTimeout(c, a.delay);
      } else
        c();
    }
  },
  _delayedDragTouchMoveHandler: function(t) {
    var e = t.touches ? t.touches[0] : t;
    Math.max(Math.abs(e.clientX - this._lastX), Math.abs(e.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1)) && this._disableDelayedDrag();
  },
  _disableDelayedDrag: function() {
    m && Oe(m), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function() {
    var t = this.el.ownerDocument;
    k(t, "mouseup", this._disableDelayedDrag), k(t, "touchend", this._disableDelayedDrag), k(t, "touchcancel", this._disableDelayedDrag), k(t, "pointerup", this._disableDelayedDrag), k(t, "pointercancel", this._disableDelayedDrag), k(t, "mousemove", this._delayedDragTouchMoveHandler), k(t, "touchmove", this._delayedDragTouchMoveHandler), k(t, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function(t, e) {
    e = e || t.pointerType == "touch" && t, !this.nativeDraggable || e ? this.options.supportPointer ? E(document, "pointermove", this._onTouchMove) : e ? E(document, "touchmove", this._onTouchMove) : E(document, "mousemove", this._onTouchMove) : (E(m, "dragend", this), E(L, "dragstart", this._onDragStart));
    try {
      document.selection ? le(function() {
        document.selection.empty();
      }) : window.getSelection().removeAllRanges();
    } catch {
    }
  },
  _dragStarted: function(t, e) {
    if (Et = !1, L && m) {
      U("dragStarted", this, {
        evt: e
      }), this.nativeDraggable && E(document, "dragover", fn);
      var i = this.options;
      !t && K(m, i.dragClass, !1), K(m, i.ghostClass, !0), w.active = this, t && this._appendGhost(), z({
        sortable: this,
        name: "start",
        originalEvent: e
      });
    } else
      this._nulling();
  },
  _emulateDragOver: function() {
    if (V) {
      this._lastX = V.clientX, this._lastY = V.clientY, po();
      for (var t = document.elementFromPoint(V.clientX, V.clientY), e = t; t && t.shadowRoot && (t = t.shadowRoot.elementFromPoint(V.clientX, V.clientY), t !== e); )
        e = t;
      if (m.parentNode[W]._isOutsideThisEl(t), e)
        do {
          if (e[W]) {
            var i = void 0;
            if (i = e[W]._onDragOver({
              clientX: V.clientX,
              clientY: V.clientY,
              target: t,
              rootEl: e
            }), i && !this.options.dragoverBubble)
              break;
          }
          t = e;
        } while (e = oo(e));
      fo();
    }
  },
  _onTouchMove: function(t) {
    if (_t) {
      var e = this.options, i = e.fallbackTolerance, o = e.fallbackOffset, n = t.touches ? t.touches[0] : t, a = x && Lt(x, !0), r = x && a && a.a, c = x && a && a.d, l = ie && N && Ei(N), h = (n.clientX - _t.clientX + o.x) / (r || 1) + (l ? l[0] - Re[0] : 0) / (r || 1), d = (n.clientY - _t.clientY + o.y) / (c || 1) + (l ? l[1] - Re[1] : 0) / (c || 1);
      if (!w.active && !Et) {
        if (i && Math.max(Math.abs(n.clientX - this._lastX), Math.abs(n.clientY - this._lastY)) < i)
          return;
        this._onDragStart(t, !0);
      }
      if (x) {
        a ? (a.e += h - (Ie || 0), a.f += d - (Pe || 0)) : a = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: h,
          f: d
        };
        var p = "matrix(".concat(a.a, ",").concat(a.b, ",").concat(a.c, ",").concat(a.d, ",").concat(a.e, ",").concat(a.f, ")");
        b(x, "webkitTransform", p), b(x, "mozTransform", p), b(x, "msTransform", p), b(x, "transform", p), Ie = h, Pe = d, V = n;
      }
      t.cancelable && t.preventDefault();
    }
  },
  _appendGhost: function() {
    if (!x) {
      var t = this.options.fallbackOnBody ? document.body : L, e = I(m, !0, ie, !0, t), i = this.options;
      if (ie) {
        for (N = t; b(N, "position") === "static" && b(N, "transform") === "none" && N !== document; )
          N = N.parentNode;
        N !== document.body && N !== document.documentElement ? (N === document && (N = Q()), e.top += N.scrollTop, e.left += N.scrollLeft) : N = Q(), Re = Ei(N);
      }
      x = m.cloneNode(!0), K(x, i.ghostClass, !1), K(x, i.fallbackClass, !0), K(x, i.dragClass, !0), b(x, "transition", ""), b(x, "transform", ""), b(x, "box-sizing", "border-box"), b(x, "margin", 0), b(x, "top", e.top), b(x, "left", e.left), b(x, "width", e.width), b(x, "height", e.height), b(x, "opacity", "0.8"), b(x, "position", ie ? "absolute" : "fixed"), b(x, "zIndex", "100000"), b(x, "pointerEvents", "none"), w.ghost = x, t.appendChild(x), b(x, "transform-origin", Ai / parseInt(x.style.width) * 100 + "% " + Li / parseInt(x.style.height) * 100 + "%");
    }
  },
  _onDragStart: function(t, e) {
    var i = this, o = t.dataTransfer, n = i.options;
    if (U("dragStart", this, {
      evt: t
    }), w.eventCanceled) {
      this._onDrop();
      return;
    }
    U("setupClone", this), w.eventCanceled || (T = ro(m), T.removeAttribute("id"), T.draggable = !1, T.style["will-change"] = "", this._hideClone(), K(T, this.options.chosenClass, !1), w.clone = T), i.cloneId = le(function() {
      U("clone", i), !w.eventCanceled && (i.options.removeCloneOnHide || L.insertBefore(T, m), i._hideClone(), z({
        sortable: i,
        name: "clone"
      }));
    }), !e && K(m, n.dragClass, !0), e ? (pe = !0, i._loopId = setInterval(i._emulateDragOver, 50)) : (k(document, "mouseup", i._onDrop), k(document, "touchend", i._onDrop), k(document, "touchcancel", i._onDrop), o && (o.effectAllowed = "move", n.setData && n.setData.call(i, o, m)), E(document, "drop", i), b(m, "transform", "translateZ(0)")), Et = !0, i._dragStartId = le(i._dragStarted.bind(i, e, t)), E(document, "selectstart", i), Nt = !0, window.getSelection().removeAllRanges(), Ut && b(document.body, "user-select", "none");
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function(t) {
    var e = this.el, i = t.target, o, n, a, r = this.options, c = r.group, l = w.active, h = te === c, d = r.sort, p = R || l, f, u = this, _ = !1;
    if (Ve) return;
    function v(Rt, xo) {
      U(Rt, u, J({
        evt: t,
        isOwner: h,
        axis: f ? "vertical" : "horizontal",
        revert: a,
        dragRect: o,
        targetRect: n,
        canSort: d,
        fromSortable: p,
        target: i,
        completed: $,
        onMove: function(li, So) {
          return oe(L, e, m, o, li, I(li), t, So);
        },
        changed: A
      }, xo));
    }
    function y() {
      v("dragOverAnimationCapture"), u.captureAnimationState(), u !== p && p.captureAnimationState();
    }
    function $(Rt) {
      return v("dragOverCompleted", {
        insertion: Rt
      }), Rt && (h ? l._hideClone() : l._showClone(u), u !== p && (K(m, R ? R.options.ghostClass : l.options.ghostClass, !1), K(m, r.ghostClass, !0)), R !== u && u !== w.active ? R = u : u === w.active && R && (R = null), p === u && (u._ignoreWhileAnimating = i), u.animateAll(function() {
        v("dragOverAnimationComplete"), u._ignoreWhileAnimating = null;
      }), u !== p && (p.animateAll(), p._ignoreWhileAnimating = null)), (i === m && !m.animated || i === e && !i.animated) && ($t = null), !r.dragoverBubble && !t.rootEl && i !== document && (m.parentNode[W]._isOutsideThisEl(t.target), !Rt && mt(t)), !r.dragoverBubble && t.stopPropagation && t.stopPropagation(), _ = !0;
    }
    function A() {
      H = q(m), at = q(m, r.draggable), z({
        sortable: u,
        name: "change",
        toEl: e,
        newIndex: H,
        newDraggableIndex: at,
        originalEvent: t
      });
    }
    if (t.preventDefault !== void 0 && t.cancelable && t.preventDefault(), i = G(i, r.draggable, e, !0), v("dragOver"), w.eventCanceled) return _;
    if (m.contains(t.target) || i.animated && i.animatingX && i.animatingY || u._ignoreWhileAnimating === i)
      return $(!1);
    if (pe = !1, l && !r.disabled && (h ? d || (a = C !== L) : R === this || (this.lastPutMode = te.checkPull(this, l, m, t)) && c.checkPut(this, l, m, t))) {
      if (f = this._getDirection(t, i) === "vertical", o = I(m), v("dragOverValid"), w.eventCanceled) return _;
      if (a)
        return C = L, y(), this._hideClone(), v("revert"), w.eventCanceled || (yt ? L.insertBefore(m, yt) : L.appendChild(m)), $(!0);
      var S = ai(e, r.draggable);
      if (!S || vn(t, f, this) && !S.animated) {
        if (S === m)
          return $(!1);
        if (S && e === t.target && (i = S), i && (n = I(i)), oe(L, e, m, o, i, n, t, !!i) !== !1)
          return y(), S && S.nextSibling ? e.insertBefore(m, S.nextSibling) : e.appendChild(m), C = e, A(), $(!0);
      } else if (S && mn(t, f, this)) {
        var F = Ct(e, 0, r, !0);
        if (F === m)
          return $(!1);
        if (i = F, n = I(i), oe(L, e, m, o, i, n, t, !1) !== !1)
          return y(), e.insertBefore(m, F), C = e, A(), $(!0);
      } else if (i.parentNode === e) {
        n = I(i);
        var j = 0, O, X = m.parentNode !== e, M = !hn(m.animated && m.toRect || o, i.animated && i.toRect || n, f), ht = f ? "top" : "left", ot = ki(i, "top", "top") || ki(m, "top", "top"), It = ot ? ot.scrollTop : void 0;
        $t !== i && (O = n[ht], qt = !1, ee = !M && r.invertSwap || X), j = yn(t, i, n, f, M ? 1 : r.swapThreshold, r.invertedSwapThreshold == null ? r.swapThreshold : r.invertedSwapThreshold, ee, $t === i);
        var Z;
        if (j !== 0) {
          var pt = q(m);
          do
            pt -= j, Z = C.children[pt];
          while (Z && (b(Z, "display") === "none" || Z === x));
        }
        if (j === 0 || Z === i)
          return $(!1);
        $t = i, Ht = j;
        var Pt = i.nextElementSibling, nt = !1;
        nt = j === 1;
        var Zt = oe(L, e, m, o, i, n, t, nt);
        if (Zt !== !1)
          return (Zt === 1 || Zt === -1) && (nt = Zt === 1), Ve = !0, setTimeout(_n, 30), y(), nt && !Pt ? e.appendChild(m) : i.parentNode.insertBefore(m, nt ? Pt : i), ot && so(ot, 0, It - ot.scrollTop), C = m.parentNode, O !== void 0 && !ee && (ce = Math.abs(O - I(i)[ht])), A(), $(!0);
      }
      if (e.contains(m))
        return $(!1);
    }
    return !1;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function() {
    k(document, "mousemove", this._onTouchMove), k(document, "touchmove", this._onTouchMove), k(document, "pointermove", this._onTouchMove), k(document, "dragover", mt), k(document, "mousemove", mt), k(document, "touchmove", mt);
  },
  _offUpEvents: function() {
    var t = this.el.ownerDocument;
    k(t, "mouseup", this._onDrop), k(t, "touchend", this._onDrop), k(t, "pointerup", this._onDrop), k(t, "pointercancel", this._onDrop), k(t, "touchcancel", this._onDrop), k(document, "selectstart", this);
  },
  _onDrop: function(t) {
    var e = this.el, i = this.options;
    if (H = q(m), at = q(m, i.draggable), U("drop", this, {
      evt: t
    }), C = m && m.parentNode, H = q(m), at = q(m, i.draggable), w.eventCanceled) {
      this._nulling();
      return;
    }
    Et = !1, ee = !1, qt = !1, clearInterval(this._loopId), clearTimeout(this._dragStartTimer), Ge(this.cloneId), Ge(this._dragStartId), this.nativeDraggable && (k(document, "drop", this), k(e, "dragstart", this._onDragStart)), this._offMoveEvents(), this._offUpEvents(), Ut && b(document.body, "user-select", ""), b(m, "transform", ""), t && (Nt && (t.cancelable && t.preventDefault(), !i.dropBubble && t.stopPropagation()), x && x.parentNode && x.parentNode.removeChild(x), (L === C || R && R.lastPutMode !== "clone") && T && T.parentNode && T.parentNode.removeChild(T), m && (this.nativeDraggable && k(m, "dragend", this), Oe(m), m.style["will-change"] = "", Nt && !Et && K(m, R ? R.options.ghostClass : this.options.ghostClass, !1), K(m, this.options.chosenClass, !1), z({
      sortable: this,
      name: "unchoose",
      toEl: C,
      newIndex: null,
      newDraggableIndex: null,
      originalEvent: t
    }), L !== C ? (H >= 0 && (z({
      rootEl: C,
      name: "add",
      toEl: C,
      fromEl: L,
      originalEvent: t
    }), z({
      sortable: this,
      name: "remove",
      toEl: C,
      originalEvent: t
    }), z({
      rootEl: C,
      name: "sort",
      toEl: C,
      fromEl: L,
      originalEvent: t
    }), z({
      sortable: this,
      name: "sort",
      toEl: C,
      originalEvent: t
    })), R && R.save()) : H !== At && H >= 0 && (z({
      sortable: this,
      name: "update",
      toEl: C,
      originalEvent: t
    }), z({
      sortable: this,
      name: "sort",
      toEl: C,
      originalEvent: t
    })), w.active && ((H == null || H === -1) && (H = At, at = Kt), z({
      sortable: this,
      name: "end",
      toEl: C,
      originalEvent: t
    }), this.save()))), this._nulling();
  },
  _nulling: function() {
    U("nulling", this), L = m = C = x = yt = T = re = rt = _t = V = Nt = H = at = At = Kt = $t = Ht = R = te = w.dragged = w.ghost = w.clone = w.active = null, ge.forEach(function(t) {
      t.checked = !0;
    }), ge.length = Ie = Pe = 0;
  },
  handleEvent: function(t) {
    switch (t.type) {
      case "drop":
      case "dragend":
        this._onDrop(t);
        break;
      case "dragenter":
      case "dragover":
        m && (this._onDragOver(t), gn(t));
        break;
      case "selectstart":
        t.preventDefault();
        break;
    }
  },
  /**
   * Serializes the item into an array of string.
   * @returns {String[]}
   */
  toArray: function() {
    for (var t = [], e, i = this.el.children, o = 0, n = i.length, a = this.options; o < n; o++)
      e = i[o], G(e, a.draggable, this.el, !1) && t.push(e.getAttribute(a.dataIdAttr) || wn(e));
    return t;
  },
  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function(t, e) {
    var i = {}, o = this.el;
    this.toArray().forEach(function(n, a) {
      var r = o.children[a];
      G(r, this.options.draggable, o, !1) && (i[n] = r);
    }, this), e && this.captureAnimationState(), t.forEach(function(n) {
      i[n] && (o.removeChild(i[n]), o.appendChild(i[n]));
    }), e && this.animateAll();
  },
  /**
   * Save the current sorting
   */
  save: function() {
    var t = this.options.store;
    t && t.set && t.set(this);
  },
  /**
   * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
   * @param   {HTMLElement}  el
   * @param   {String}       [selector]  default: `options.draggable`
   * @returns {HTMLElement|null}
   */
  closest: function(t, e) {
    return G(t, e || this.options.draggable, this.el, !1);
  },
  /**
   * Set/get option
   * @param   {string} name
   * @param   {*}      [value]
   * @returns {*}
   */
  option: function(t, e) {
    var i = this.options;
    if (e === void 0)
      return i[t];
    var o = Jt.modifyOption(this, t, e);
    typeof o < "u" ? i[t] = o : i[t] = e, t === "group" && ho(i);
  },
  /**
   * Destroy
   */
  destroy: function() {
    U("destroy", this);
    var t = this.el;
    t[W] = null, k(t, "mousedown", this._onTapStart), k(t, "touchstart", this._onTapStart), k(t, "pointerdown", this._onTapStart), this.nativeDraggable && (k(t, "dragover", this), k(t, "dragenter", this)), Array.prototype.forEach.call(t.querySelectorAll("[draggable]"), function(e) {
      e.removeAttribute("draggable");
    }), this._onDrop(), this._disableDelayedDragEvents(), fe.splice(fe.indexOf(this.el), 1), this.el = t = null;
  },
  _hideClone: function() {
    if (!rt) {
      if (U("hideClone", this), w.eventCanceled) return;
      b(T, "display", "none"), this.options.removeCloneOnHide && T.parentNode && T.parentNode.removeChild(T), rt = !0;
    }
  },
  _showClone: function(t) {
    if (t.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (rt) {
      if (U("showClone", this), w.eventCanceled) return;
      m.parentNode == L && !this.options.group.revertClone ? L.insertBefore(T, m) : yt ? L.insertBefore(T, yt) : L.appendChild(T), this.options.group.revertClone && this.animate(m, T), b(T, "display", ""), rt = !1;
    }
  }
};
function gn(s) {
  s.dataTransfer && (s.dataTransfer.dropEffect = "move"), s.cancelable && s.preventDefault();
}
function oe(s, t, e, i, o, n, a, r) {
  var c, l = s[W], h = l.options.onMove, d;
  return window.CustomEvent && !it && !Qt ? c = new CustomEvent("move", {
    bubbles: !0,
    cancelable: !0
  }) : (c = document.createEvent("Event"), c.initEvent("move", !0, !0)), c.to = t, c.from = s, c.dragged = e, c.draggedRect = i, c.related = o || t, c.relatedRect = n || I(t), c.willInsertAfter = r, c.originalEvent = a, s.dispatchEvent(c), h && (d = h.call(l, c, a)), d;
}
function Oe(s) {
  s.draggable = !1;
}
function _n() {
  Ve = !1;
}
function mn(s, t, e) {
  var i = I(Ct(e.el, 0, e.options, !0)), o = co(e.el, e.options, x), n = 10;
  return t ? s.clientX < o.left - n || s.clientY < i.top && s.clientX < i.right : s.clientY < o.top - n || s.clientY < i.bottom && s.clientX < i.left;
}
function vn(s, t, e) {
  var i = I(ai(e.el, e.options.draggable)), o = co(e.el, e.options, x), n = 10;
  return t ? s.clientX > o.right + n || s.clientY > i.bottom && s.clientX > i.left : s.clientY > o.bottom + n || s.clientX > i.right && s.clientY > i.top;
}
function yn(s, t, e, i, o, n, a, r) {
  var c = i ? s.clientY : s.clientX, l = i ? e.height : e.width, h = i ? e.top : e.left, d = i ? e.bottom : e.right, p = !1;
  if (!a) {
    if (r && ce < l * o) {
      if (!qt && (Ht === 1 ? c > h + l * n / 2 : c < d - l * n / 2) && (qt = !0), qt)
        p = !0;
      else if (Ht === 1 ? c < h + ce : c > d - ce)
        return -Ht;
    } else if (c > h + l * (1 - o) / 2 && c < d - l * (1 - o) / 2)
      return bn(t);
  }
  return p = p || a, p && (c < h + l * n / 2 || c > d - l * n / 2) ? c > h + l / 2 ? 1 : -1 : 0;
}
function bn(s) {
  return q(m) < q(s) ? 1 : -1;
}
function wn(s) {
  for (var t = s.tagName + s.className + s.src + s.href + s.textContent, e = t.length, i = 0; e--; )
    i += t.charCodeAt(e);
  return i.toString(36);
}
function xn(s) {
  ge.length = 0;
  for (var t = s.getElementsByTagName("input"), e = t.length; e--; ) {
    var i = t[e];
    i.checked && ge.push(i);
  }
}
function le(s) {
  return setTimeout(s, 0);
}
function Ge(s) {
  return clearTimeout(s);
}
$e && E(document, "touchmove", function(s) {
  (w.active || Et) && s.cancelable && s.preventDefault();
});
w.utils = {
  on: E,
  off: k,
  css: b,
  find: no,
  is: function(t, e) {
    return !!G(t, e, t, !1);
  },
  extend: nn,
  throttle: ao,
  closest: G,
  toggleClass: K,
  clone: ro,
  index: q,
  nextTick: le,
  cancelNextTick: Ge,
  detectDirection: uo,
  getChild: Ct,
  expando: W
};
w.get = function(s) {
  return s[W];
};
w.mount = function() {
  for (var s = arguments.length, t = new Array(s), e = 0; e < s; e++)
    t[e] = arguments[e];
  t[0].constructor === Array && (t = t[0]), t.forEach(function(i) {
    if (!i.prototype || !i.prototype.constructor)
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(i));
    i.utils && (w.utils = J(J({}, w.utils), i.utils)), Jt.mount(i);
  });
};
w.create = function(s, t) {
  return new w(s, t);
};
w.version = en;
var D = [], Bt, Ye, Xe = !1, Me, Ne, _e, Ft;
function Sn() {
  function s() {
    this.defaults = {
      scroll: !0,
      forceAutoScrollFallback: !1,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: !0
    };
    for (var t in this)
      t.charAt(0) === "_" && typeof this[t] == "function" && (this[t] = this[t].bind(this));
  }
  return s.prototype = {
    dragStarted: function(e) {
      var i = e.originalEvent;
      this.sortable.nativeDraggable ? E(document, "dragover", this._handleAutoScroll) : this.options.supportPointer ? E(document, "pointermove", this._handleFallbackAutoScroll) : i.touches ? E(document, "touchmove", this._handleFallbackAutoScroll) : E(document, "mousemove", this._handleFallbackAutoScroll);
    },
    dragOverCompleted: function(e) {
      var i = e.originalEvent;
      !this.options.dragOverBubble && !i.rootEl && this._handleAutoScroll(i);
    },
    drop: function() {
      this.sortable.nativeDraggable ? k(document, "dragover", this._handleAutoScroll) : (k(document, "pointermove", this._handleFallbackAutoScroll), k(document, "touchmove", this._handleFallbackAutoScroll), k(document, "mousemove", this._handleFallbackAutoScroll)), Ci(), de(), an();
    },
    nulling: function() {
      _e = Ye = Bt = Xe = Ft = Me = Ne = null, D.length = 0;
    },
    _handleFallbackAutoScroll: function(e) {
      this._handleAutoScroll(e, !0);
    },
    _handleAutoScroll: function(e, i) {
      var o = this, n = (e.touches ? e.touches[0] : e).clientX, a = (e.touches ? e.touches[0] : e).clientY, r = document.elementFromPoint(n, a);
      if (_e = e, i || this.options.forceAutoScrollFallback || Qt || it || Ut) {
        Be(e, this.options, r, i);
        var c = lt(r, !0);
        Xe && (!Ft || n !== Me || a !== Ne) && (Ft && Ci(), Ft = setInterval(function() {
          var l = lt(document.elementFromPoint(n, a), !0);
          l !== c && (c = l, de()), Be(e, o.options, l, i);
        }, 10), Me = n, Ne = a);
      } else {
        if (!this.options.bubbleScroll || lt(r, !0) === Q()) {
          de();
          return;
        }
        Be(e, this.options, lt(r, !1), !1);
      }
    }
  }, et(s, {
    pluginName: "scroll",
    initializeByDefault: !0
  });
}
function de() {
  D.forEach(function(s) {
    clearInterval(s.pid);
  }), D = [];
}
function Ci() {
  clearInterval(Ft);
}
var Be = ao(function(s, t, e, i) {
  if (t.scroll) {
    var o = (s.touches ? s.touches[0] : s).clientX, n = (s.touches ? s.touches[0] : s).clientY, a = t.scrollSensitivity, r = t.scrollSpeed, c = Q(), l = !1, h;
    Ye !== e && (Ye = e, de(), Bt = t.scroll, h = t.scrollFn, Bt === !0 && (Bt = lt(e, !0)));
    var d = 0, p = Bt;
    do {
      var f = p, u = I(f), _ = u.top, v = u.bottom, y = u.left, $ = u.right, A = u.width, S = u.height, F = void 0, j = void 0, O = f.scrollWidth, X = f.scrollHeight, M = b(f), ht = f.scrollLeft, ot = f.scrollTop;
      f === c ? (F = A < O && (M.overflowX === "auto" || M.overflowX === "scroll" || M.overflowX === "visible"), j = S < X && (M.overflowY === "auto" || M.overflowY === "scroll" || M.overflowY === "visible")) : (F = A < O && (M.overflowX === "auto" || M.overflowX === "scroll"), j = S < X && (M.overflowY === "auto" || M.overflowY === "scroll"));
      var It = F && (Math.abs($ - o) <= a && ht + A < O) - (Math.abs(y - o) <= a && !!ht), Z = j && (Math.abs(v - n) <= a && ot + S < X) - (Math.abs(_ - n) <= a && !!ot);
      if (!D[d])
        for (var pt = 0; pt <= d; pt++)
          D[pt] || (D[pt] = {});
      (D[d].vx != It || D[d].vy != Z || D[d].el !== f) && (D[d].el = f, D[d].vx = It, D[d].vy = Z, clearInterval(D[d].pid), (It != 0 || Z != 0) && (l = !0, D[d].pid = setInterval((function() {
        i && this.layer === 0 && w.active._onTouchMove(_e);
        var Pt = D[this.layer].vy ? D[this.layer].vy * r : 0, nt = D[this.layer].vx ? D[this.layer].vx * r : 0;
        typeof h == "function" && h.call(w.dragged.parentNode[W], nt, Pt, s, _e, D[this.layer].el) !== "continue" || so(D[this.layer].el, nt, Pt);
      }).bind({
        layer: d
      }), 24))), d++;
    } while (t.bubbleScroll && p !== c && (p = lt(p, !1)));
    Xe = l;
  }
}, 30), go = function(t) {
  var e = t.originalEvent, i = t.putSortable, o = t.dragEl, n = t.activeSortable, a = t.dispatchSortableEvent, r = t.hideGhostForTarget, c = t.unhideGhostForTarget;
  if (e) {
    var l = i || n;
    r();
    var h = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e, d = document.elementFromPoint(h.clientX, h.clientY);
    c(), l && !l.el.contains(d) && (a("spill"), this.onSpill({
      dragEl: o,
      putSortable: i
    }));
  }
};
function si() {
}
si.prototype = {
  startIndex: null,
  dragStart: function(t) {
    var e = t.oldDraggableIndex;
    this.startIndex = e;
  },
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable;
    this.sortable.captureAnimationState(), i && i.captureAnimationState();
    var o = Ct(this.sortable.el, this.startIndex, this.options);
    o ? this.sortable.el.insertBefore(e, o) : this.sortable.el.appendChild(e), this.sortable.animateAll(), i && i.animateAll();
  },
  drop: go
};
et(si, {
  pluginName: "revertOnSpill"
});
function ri() {
}
ri.prototype = {
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable, o = i || this.sortable;
    o.captureAnimationState(), e.parentNode && e.parentNode.removeChild(e), o.animateAll();
  },
  drop: go
};
et(ri, {
  pluginName: "removeOnSpill"
});
w.mount(new Sn());
w.mount(ri, si);
function $n(s) {
  const t = s.toLowerCase(), e = {
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
  for (const [o, n] of Object.entries(e))
    if (n.some((a) => t.includes(a)))
      return i[o] ?? null;
  return null;
}
function kn(s) {
  return {
    floor: "mdi:layers",
    area: "mdi:map-marker",
    building: "mdi:office-building",
    grounds: "mdi:pine-tree",
    subarea: "mdi:map-marker-radius"
  }[s] ?? "mdi:map-marker";
}
function En(s) {
  const t = String(s ?? "area").trim().toLowerCase();
  return t === "room" ? "area" : t === "floor" ? "floor" : t === "area" ? "area" : t === "building" ? "building" : t === "grounds" ? "grounds" : t === "subarea" ? "subarea" : "area";
}
function _o(s) {
  var o;
  const t = (o = s.modules) == null ? void 0 : o._meta;
  if (t != null && t.icon) return String(t.icon);
  const e = $n(s.name);
  if (e) return e;
  const i = En(t == null ? void 0 : t.type);
  return kn(i);
}
const An = 24, Ln = 0.18, Tn = 6;
function Cn(s, t) {
  const e = /* @__PURE__ */ new Set([t]);
  let i = !0;
  for (; i; ) {
    i = !1;
    for (const o of s) {
      const n = o.location.parent_id;
      n && e.has(n) && !e.has(o.location.id) && (e.add(o.location.id), i = !0);
    }
  }
  return e;
}
function Di(s, t) {
  const e = new Map(s.map((d) => [d.id, d])), i = /* @__PURE__ */ new Map(), o = (d) => {
    const p = d.parent_id;
    return !p || p === d.id || !e.has(p) ? null : p;
  };
  for (const d of s) {
    const p = o(d);
    i.has(p) || i.set(p, []), i.get(p).push(d);
  }
  const n = [], a = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), l = [...i.get(null) || []];
  for (; l.length; ) {
    const d = l.pop();
    if (!r.has(d.id)) {
      r.add(d.id);
      for (const p of i.get(d.id) || [])
        l.push(p);
    }
  }
  function h(d, p) {
    const f = i.get(d) || [];
    for (const u of f) {
      if (a.has(u.id)) continue;
      a.add(u.id);
      const v = (i.get(u.id) || []).length > 0, y = t.has(u.id);
      n.push({ location: u, depth: p, hasChildren: v, isExpanded: y }), y && v && h(u.id, p + 1);
    }
  }
  h(null, 0);
  for (const d of s) {
    if (r.has(d.id) || a.has(d.id)) continue;
    a.add(d.id);
    const f = (i.get(d.id) || []).length > 0, u = t.has(d.id);
    n.push({ location: d, depth: 0, hasChildren: f, isExpanded: u }), u && f && h(d.id, 1);
  }
  return n;
}
function Ii(s, t, e, i) {
  if (i) {
    const r = s.left;
    if (t >= r && t < r + An) return "outdent";
  }
  const o = e - s.top, n = Math.max(s.height, 1), a = Math.min(
    n / 3,
    Math.max(Tn, n * Ln)
  );
  return o < a ? "before" : o >= n - a ? "after" : "inside";
}
function Dn(s, t, e, i, o) {
  const n = Cn(s, t), a = s.filter((d) => !n.has(d.location.id)), r = a.find((d) => d.location.id === i);
  if (!r) return { parentId: e, siblingIndex: 0 };
  const c = o === "inside" ? i : r.location.parent_id, l = a.filter((d) => d.location.parent_id === c), h = l.findIndex((d) => d.location.id === i);
  return o === "inside" ? { parentId: i, siblingIndex: l.length } : o === "before" ? { parentId: c, siblingIndex: h >= 0 ? h : 0 } : o === "after" ? { parentId: c, siblingIndex: Math.min(h >= 0 ? h + 1 : l.length, l.length) } : { parentId: c, siblingIndex: h >= 0 ? h : 0 };
}
const Pi = "application/x-topomation-entity-id", ve = class ve extends ut {
  constructor() {
    super(...arguments), this.locations = [], this.version = 0, this.occupancyStates = {}, this.readOnly = !1, this.allowMove = !1, this.allowRename = !1, this._expandedIds = /* @__PURE__ */ new Set(), this._editingValue = "", this._isDragging = !1, this._hasInitializedExpansion = !1;
  }
  _resolveRelatedId(t) {
    var a;
    const e = ((a = t.dragged) == null ? void 0 : a.getAttribute("data-id")) || void 0, i = t.related;
    if (!e || !(i != null && i.classList.contains("tree-item"))) return;
    const o = i.getAttribute("data-id") || void 0;
    if (o && o !== e && !qe(this.locations, e, o))
      return o;
    let n = i;
    for (; n; ) {
      if (n.classList.contains("tree-item")) {
        const r = n.getAttribute("data-id") || void 0;
        if (r && r !== e && !qe(this.locations, e, r))
          return r;
      }
      n = t.willInsertAfter ? n.nextElementSibling : n.previousElementSibling;
    }
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("locations") && this.locations.length > 0 && this._initializeExpansion();
  }
  firstUpdated() {
    this._initializeSortable();
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._sortable) == null || t.destroy(), this._sortable = void 0, this._boundDragOver = void 0, this._draggedId = void 0, this._entityDropTargetId = void 0;
  }
  updated(t) {
    super.updated(t), (t.has("locations") || t.has("version")) && (this._cleanupDuplicateTreeItems(), this._isDragging || this._initializeSortable());
  }
  _initializeExpansion() {
    if (this.locations.length === 0) return;
    const t = /* @__PURE__ */ new Set();
    for (const e of this.locations)
      e.parent_id && t.add(e.parent_id);
    if (!this._hasInitializedExpansion)
      this._expandedIds = /* @__PURE__ */ new Set(), this._hasInitializedExpansion = !0;
    else {
      const e = /* @__PURE__ */ new Set();
      for (const i of this._expandedIds)
        t.has(i) && e.add(i);
      this._expandedIds = e;
    }
  }
  _initializeSortable() {
    var t;
    (t = this._sortable) == null || t.destroy(), this.updateComplete.then(() => {
      var i;
      const e = (i = this.shadowRoot) == null ? void 0 : i.querySelector(".tree-list");
      e && (this._sortable = w.create(e, {
        handle: ".drag-handle:not(.disabled)",
        animation: 150,
        ghostClass: "sortable-ghost",
        // Keep all rows as valid drop targets; hierarchy-rules.ts enforces move constraints.
        draggable: ".tree-item",
        onStart: (o) => {
          var n;
          this._isDragging = !0, this._dropIndicator = void 0, this._entityDropTargetId = void 0, this._draggedId = ((n = o.item) == null ? void 0 : n.getAttribute("data-id")) ?? void 0, this._boundDragOver = this._handleContinuousDragOver.bind(this), e.addEventListener("dragover", this._boundDragOver);
        },
        onMove: (o) => {
          var r;
          const n = ((r = o.dragged) == null ? void 0 : r.getAttribute("data-id")) || void 0, a = o.related;
          if (n && (a != null && a.classList.contains("tree-item"))) {
            const c = this._resolveRelatedId(o) ?? a.getAttribute("data-id") ?? void 0;
            if (!c || c === n)
              return this._activeDropTarget = void 0, this._dropIndicator = void 0, !0;
            const l = a.getBoundingClientRect(), h = o.originalEvent, d = typeof (h == null ? void 0 : h.clientX) == "number" ? h.clientX : l.left + l.width / 2, p = typeof (h == null ? void 0 : h.clientY) == "number" ? h.clientY : l.top + l.height / 2, f = this.locations.find((y) => y.id === n), u = (f == null ? void 0 : f.parent_id) ?? null, v = Ii(l, d, p, c === u);
            this._activeDropTarget = { relatedId: c, zone: v }, this._updateDropIndicator(n, a, v);
          } else
            this._activeDropTarget = void 0, this._dropIndicator = void 0;
          return !0;
        },
        onEnd: (o) => {
          this._isDragging = !1, this._dropIndicator = void 0, this._entityDropTargetId = void 0, this._boundDragOver && (e.removeEventListener("dragover", this._boundDragOver), this._boundDragOver = void 0), this._handleDragEnd(o), this._activeDropTarget = void 0, this._draggedId = void 0, this.updateComplete.then(() => {
            this._cleanupDuplicateTreeItems(), this._initializeSortable();
          });
        }
      }));
    });
  }
  _handleDragEnd(t) {
    const { item: e } = t, i = e.getAttribute("data-id");
    if (!i) return;
    const o = this.locations.find((d) => d.id === i);
    if (!o) return;
    const n = this._activeDropTarget;
    if (!n) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    const a = Di(this.locations, this._expandedIds), r = Dn(
      a,
      i,
      o.parent_id,
      n.relatedId,
      n.zone
    ), { parentId: c, siblingIndex: l } = r, h = a.filter((d) => d.location.parent_id === o.parent_id).findIndex((d) => d.location.id === i);
    if (c === o.parent_id && l === h) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    if (!Vo({ locations: this.locations, locationId: i, newParentId: c })) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    this.dispatchEvent(new CustomEvent("location-moved", {
      detail: { locationId: i, newParentId: c, newIndex: l },
      bubbles: !0,
      composed: !0
    }));
  }
  _handleContinuousDragOver(t) {
    var h, d;
    t.preventDefault();
    const e = this._draggedId;
    if (!e) return;
    const i = (d = (h = t.target) == null ? void 0 : h.closest) == null ? void 0 : d.call(h, ".tree-item");
    if (!i) return;
    const o = i.getAttribute("data-id");
    if (!o || o === e) return;
    const n = i.getBoundingClientRect(), a = this.locations.find((p) => p.id === e), r = (a == null ? void 0 : a.parent_id) ?? null, c = o === r, l = Ii(n, t.clientX, t.clientY, c);
    this._activeDropTarget = { relatedId: o, zone: l }, this._updateDropIndicator(e, i, l);
  }
  _restoreTreeAfterCancelledDrop() {
    this._dropIndicator = void 0, this.requestUpdate(), this.updateComplete.then(() => {
      this._cleanupDuplicateTreeItems(), this._initializeSortable();
    });
  }
  _updateDropIndicator(t, e, i) {
    var p;
    const o = (p = this.shadowRoot) == null ? void 0 : p.querySelector(".tree-list");
    if (!e || !o) {
      this._dropIndicator = void 0;
      return;
    }
    const n = o.getBoundingClientRect(), a = e.getBoundingClientRect(), r = i === "inside" ? "child" : i === "outdent" ? "outdent" : "sibling", c = i === "inside" ? "Child" : i === "outdent" ? "Outdent" : i === "after" ? "After" : "Before";
    let l = a.left - n.left + 6;
    i === "inside" && (l += 24), i === "outdent" && (l -= 24), l = Math.max(8, Math.min(l, n.width - 44));
    const h = Math.max(36, n.width - l - 8), d = i === "after" ? a.bottom - n.top : i === "before" ? a.top - n.top : i === "inside" ? a.bottom - n.top : a.top - n.top;
    this._dropIndicator = { top: d, left: l, width: h, intent: r, label: c };
  }
  _cleanupDuplicateTreeItems() {
    var o;
    const t = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".tree-list");
    if (!t) return;
    const e = Array.from(t.querySelectorAll(".tree-item[data-id]")), i = /* @__PURE__ */ new Set();
    for (const n of e) {
      const a = n.getAttribute("data-id");
      if (a) {
        if (i.has(a)) {
          n.remove();
          continue;
        }
        i.add(a);
      }
    }
  }
  render() {
    if (!this.locations.length)
      return g`
        <div class="empty-state">
          <ha-icon icon="mdi:map-marker-plus" class="empty-state-icon"></ha-icon>
          <div class="empty-state-message">
            ${this.readOnly, "No locations yet. Create your first location to get started."}
          </div>
          ${this.readOnly ? g`
                <a
                  href="/config/areas"
                  class="button button-primary empty-state-cta"
                  @click=${this._handleOpenSettings}
                >
                  <ha-icon icon="mdi:cog"></ha-icon>
                  Open Settings → Areas & Floors
                </a>
              ` : g`<button class="button" @click=${this._handleCreate}>+ New Location</button>`}
        </div>
      `;
    const t = Di(this._visibleTreeLocations(), this._expandedIds), e = this._computeOccupancyStatusByLocation(), i = this._computeLockStateByLocation();
    return g`
      <div class="tree-list">
        ${ae(
      t,
      (o) => `${this.version}:${o.location.id}:${o.depth}`,
      (o) => this._renderItem(
        o,
        e[o.location.id] || "unknown",
        i[o.location.id] || { isLocked: !1, lockedBy: [] }
      )
    )}
        ${this._dropIndicator ? g`
              <div
                class="drop-indicator ${this._dropIndicator.intent}"
                style=${`top:${this._dropIndicator.top}px;left:${this._dropIndicator.left}px;width:${this._dropIndicator.width}px;`}
              >
                <div class="drop-indicator-line"></div>
                <div class="drop-indicator-label">${this._dropIndicator.label}</div>
              </div>
            ` : ""}
      </div>
    `;
  }
  _renderItem(t, e, i) {
    var A;
    const { location: o, depth: n, hasChildren: a, isExpanded: r } = t, c = this.selectedId === o.id, l = this._editingId === o.id, h = n * 24, d = B(o), p = o.is_explicit_root ? "root" : d, f = o.is_explicit_root ? "home root" : d, u = i.isLocked ? "mdi:lock" : "mdi:lock-open-variant-outline", _ = i.isLocked ? i.lockedBy.length ? `Locked (${i.lockedBy.join(", ")})` : "Locked" : "Unlocked", v = ((A = this.occupancyStates) == null ? void 0 : A[o.id]) === !0, y = "mdi:home-switch-outline", $ = v ? "Set vacant" : "Set occupied";
    return g`
      <div
        class="tree-item ${c ? "selected" : ""} ${d === "floor" ? "floor-item" : ""} ${this._entityDropTargetId === o.id ? "entity-drop-target" : ""}"
        data-id=${o.id}
        style="margin-left: ${h}px"
        @click=${(S) => this._handleClick(S, o)}
        @dragover=${(S) => this._handleEntityDragOver(S, o.id)}
        @dragleave=${(S) => this._handleEntityDragLeave(S, o.id)}
        @drop=${(S) => this._handleEntityDrop(S, o.id)}
      >
        <div
          class="drag-handle ${this.allowMove ? "" : "disabled"}"
          title=${this.allowMove ? "Drag to reorder. Drop on top/middle/bottom of a row for before/child/after." : "Hierarchy move is disabled."}
        ><ha-icon icon="mdi:drag-vertical"></ha-icon></div>

        <button
          class="expand-btn ${r ? "expanded" : ""} ${a ? "" : "hidden"}"
          @click=${(S) => this._handleExpand(S, o.id)}
        >
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>

        <div class="location-icon">
          <ha-icon .icon=${this._getIcon(o)}></ha-icon>
        </div>
        <div
          class="occupancy-dot ${e}"
          title=${this._getOccupancyStatusLabel(e)}
        ></div>

        ${l ? g`<input class="location-name-input" .value=${this._editingValue}
                  @input=${(S) => this._editingValue = S.target.value}
                  @blur=${() => this._finishEditing(o.id)}
                  @keydown=${(S) => this._handleEditKeydown(S, o.id)}
                  @click=${(S) => S.stopPropagation()} />` : g`<div
              class="location-name"
              @dblclick=${this.allowRename ? (S) => this._startEditing(S, o) : () => {
    }}
            >${o.name}</div>`}

        <span class="type-badge ${p}">${f}</span>

        ${o.is_explicit_root || this.readOnly ? "" : g`
              <button
                class="occupancy-btn"
                title=${$}
                @click=${(S) => this._handleOccupancyToggle(S, o, v)}
              >
                <ha-icon .icon=${y}></ha-icon>
              </button>
              <button
                class="lock-btn ${i.isLocked ? "locked" : ""}"
                title=${_}
                @click=${(S) => this._handleLockToggle(S, o, i)}
              >
                <ha-icon .icon=${u}></ha-icon>
              </button>
            `}
      </div>
    `;
  }
  _getOccupancyStatusLabel(t) {
    return t === "occupied" ? "Occupied" : t === "vacant" ? "Vacant" : "Unknown occupancy";
  }
  _computeOccupancyStatusByLocation() {
    const t = {}, e = new Map(this.locations.map((a) => [a.id, a])), i = /* @__PURE__ */ new Map();
    for (const a of this.locations)
      a.parent_id && (i.has(a.parent_id) || i.set(a.parent_id, []), i.get(a.parent_id).push(a.id));
    const o = /* @__PURE__ */ new Map(), n = (a) => {
      var f;
      const r = o.get(a);
      if (r) return r;
      if (!e.has(a)) return "unknown";
      const c = (f = this.occupancyStates) == null ? void 0 : f[a], l = c === !0 ? "occupied" : c === !1 ? "vacant" : "unknown", h = i.get(a) || [];
      if (!h.length)
        return o.set(a, l), l;
      const d = h.map((u) => n(u));
      let p;
      return l === "occupied" || d.includes("occupied") ? p = "occupied" : l === "vacant" || d.length > 0 && d.every((u) => u === "vacant") ? p = "vacant" : p = "unknown", o.set(a, p), p;
    };
    for (const a of this.locations)
      t[a.id] = n(a.id);
    return t;
  }
  _computeLockStateByLocation() {
    var i;
    const t = ((i = this.hass) == null ? void 0 : i.states) || {}, e = {};
    for (const o of Object.values(t)) {
      const n = (o == null ? void 0 : o.attributes) || {};
      if (n.device_class !== "occupancy") continue;
      const a = n.location_id;
      if (!a) continue;
      const r = n.locked_by;
      e[String(a)] = {
        isLocked: !!n.is_locked,
        lockedBy: Array.isArray(r) ? r.map((c) => String(c)) : []
      };
    }
    return e;
  }
  _visibleTreeLocations() {
    return this.locations.filter((t) => !this._isManagedShadowLocation(t));
  }
  _isManagedShadowLocation(t) {
    var i;
    const e = ((i = t.modules) == null ? void 0 : i._meta) || {};
    return String(e.role || "").trim().toLowerCase() === "managed_shadow";
  }
  _getIcon(t) {
    var e, i, o;
    return t.ha_area_id && ((o = (i = (e = this.hass) == null ? void 0 : e.areas) == null ? void 0 : i[t.ha_area_id]) != null && o.icon) ? this.hass.areas[t.ha_area_id].icon : _o(t);
  }
  _hasEntityDragPayload(t) {
    var i;
    const e = Array.from(((i = t.dataTransfer) == null ? void 0 : i.types) || []);
    return e.includes(Pi) ? !0 : !this._isDragging && e.includes("text/plain");
  }
  _readEntityIdFromDrop(t) {
    var o, n;
    const e = (o = t.dataTransfer) == null ? void 0 : o.getData(Pi);
    if (e) return e;
    const i = ((n = t.dataTransfer) == null ? void 0 : n.getData("text/plain")) || "";
    return i.includes(".") ? i : void 0;
  }
  _handleEntityDragOver(t, e) {
    this._hasEntityDragPayload(t) && (t.preventDefault(), t.dataTransfer && (t.dataTransfer.dropEffect = "move"), this._entityDropTargetId = e);
  }
  _handleEntityDragLeave(t, e) {
    var o;
    if (!this._hasEntityDragPayload(t)) return;
    const i = t.relatedTarget;
    (o = i == null ? void 0 : i.closest) != null && o.call(i, `[data-id="${e}"]`) || this._entityDropTargetId === e && (this._entityDropTargetId = void 0);
  }
  _handleEntityDrop(t, e) {
    const i = this._readEntityIdFromDrop(t);
    i && (t.preventDefault(), t.stopPropagation(), this._entityDropTargetId = void 0, this.dispatchEvent(
      new CustomEvent("entity-dropped", {
        detail: { entityId: i, targetLocationId: e },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleClick(t, e) {
    const i = t.target;
    i.closest(".drag-handle") || i.closest(".expand-btn") || i.closest(".lock-btn") || i.closest(".occupancy-btn") || this.dispatchEvent(new CustomEvent("location-selected", { detail: { locationId: e.id }, bubbles: !0, composed: !0 }));
  }
  _handleExpand(t, e) {
    t.stopPropagation();
    const i = new Set(this._expandedIds);
    if (i.has(e)) {
      i.delete(e);
      const o = [e], n = /* @__PURE__ */ new Set();
      for (; o.length; ) {
        const a = o.pop();
        if (!n.has(a)) {
          n.add(a);
          for (const r of this.locations)
            r.parent_id === a && (i.delete(r.id), o.push(r.id));
        }
      }
    } else
      i.add(e);
    this._expandedIds = i;
  }
  _startEditing(t, e) {
    this.allowRename && (t.stopPropagation(), this._editingId = e.id, this._editingValue = e.name, this.updateComplete.then(() => {
      var o;
      const i = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".location-name-input");
      i == null || i.focus(), i == null || i.select();
    }));
  }
  _handleEditKeydown(t, e) {
    t.key === "Enter" ? (t.preventDefault(), this._finishEditing(e)) : t.key === "Escape" && (this._editingId = void 0);
  }
  _finishEditing(t) {
    var i;
    if (this._editingId !== t) return;
    const e = this._editingValue.trim();
    this._editingId = void 0, !(!e || e === ((i = this.locations.find((o) => o.id === t)) == null ? void 0 : i.name)) && this.dispatchEvent(new CustomEvent("location-renamed", { detail: { locationId: t, newName: e }, bubbles: !0, composed: !0 }));
  }
  _handleDelete(t, e) {
    this.readOnly || e.is_explicit_root || (t.stopPropagation(), confirm(`Delete "${e.name}"?`) && this.dispatchEvent(new CustomEvent("location-delete", { detail: { location: e }, bubbles: !0, composed: !0 })));
  }
  _handleCreate() {
    this.readOnly || this.dispatchEvent(new CustomEvent("location-create", { bubbles: !0, composed: !0 }));
  }
  _handleLockToggle(t, e, i) {
    this.readOnly || (t.stopPropagation(), this.dispatchEvent(
      new CustomEvent("location-lock-toggle", {
        detail: {
          locationId: e.id,
          lock: !i.isLocked
        },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleOccupancyToggle(t, e, i) {
    this.readOnly || (t.stopPropagation(), this.dispatchEvent(
      new CustomEvent("location-occupancy-toggle", {
        detail: {
          locationId: e.id,
          occupied: !i
        },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  _handleOpenSettings(t) {
    var i;
    t.preventDefault();
    const e = (i = this.hass) == null ? void 0 : i.navigate;
    typeof e == "function" ? e("/config/areas") : window.location.href = "/config/areas";
  }
};
ve.properties = {
  hass: { attribute: !1 },
  locations: { attribute: !1 },
  version: { type: Number },
  selectedId: {},
  occupancyStates: { attribute: !1 },
  readOnly: { type: Boolean },
  allowMove: { type: Boolean },
  allowRename: { type: Boolean },
  // Internal state
  _expandedIds: { state: !0 },
  _editingId: { state: !0 },
  _editingValue: { state: !0 },
  _isDragging: { state: !0 },
  _dropIndicator: { state: !0 },
  _entityDropTargetId: { state: !0 }
}, ve.styles = [
  Se,
  Xt`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .tree-list {
        position: relative;
        padding: var(--spacing-md);
        min-height: 100px;
      }

      .drop-indicator {
        position: absolute;
        pointer-events: none;
        z-index: 5;
      }

      .drop-indicator-line {
        height: 2px;
        width: 100%;
        border-radius: 999px;
        background: var(--primary-color);
        box-shadow: 0 0 0 1px rgba(var(--rgb-primary-color), 0.18);
      }

      .drop-indicator::before {
        content: "";
        position: absolute;
        left: -6px;
        top: -4px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--primary-color);
      }

      .drop-indicator-label {
        position: absolute;
        top: -18px;
        left: 0;
        padding: 1px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--card-background-color);
        background: rgba(var(--rgb-primary-color), 0.95);
        white-space: nowrap;
      }

      .drop-indicator.sibling .drop-indicator-label {
        background: rgba(var(--rgb-primary-color), 0.95);
      }

      .drop-indicator.child .drop-indicator-label {
        background: rgba(var(--rgb-success-color), 0.95);
      }

      .drop-indicator.outdent .drop-indicator-label {
        background: rgba(var(--rgb-warning-color), 0.95);
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

      .tree-item.entity-drop-target {
        background: rgba(var(--rgb-success-color), 0.18);
        box-shadow: inset 0 0 0 1px rgba(var(--rgb-success-color), 0.45);
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

      .occupancy-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.15);
        flex-shrink: 0;
      }

      .occupancy-dot.occupied {
        background: #22c55e;
        border-color: #16a34a;
      }

      .occupancy-dot.vacant {
        background: #d1d5db;
        border-color: #9ca3af;
      }

      .occupancy-dot.unknown {
        background: #f59e0b;
        border-color: #d97706;
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

      .type-badge.building {
        background: rgba(var(--rgb-success-color), 0.15);
        color: var(--success-color);
      }

      .type-badge.grounds {
        background: rgba(var(--rgb-info-color), 0.15);
        color: var(--info-color);
      }

      .type-badge.proxy {
        background: rgba(var(--rgb-secondary-text-color, 120, 120, 120), 0.2);
        color: var(--text-secondary-color);
      }

      .tree-item.selected .type-badge.floor {
        background: var(--primary-color);
        color: white;
      }

      .tree-item.selected .type-badge.area {
        background: var(--warning-color);
        color: white;
      }

      .tree-item.selected .type-badge.building {
        background: var(--success-color);
        color: white;
      }

      .tree-item.selected .type-badge.grounds {
        background: var(--info-color);
        color: white;
      }

      .tree-item.selected .type-badge.proxy {
        background: var(--text-secondary-color);
        color: var(--card-background-color);
      }

      .type-badge.root {
        background: rgba(var(--rgb-info-color), 0.15);
        color: var(--info-color);
      }

      .tree-item.selected .type-badge.root {
        background: var(--info-color);
        color: white;
      }

      .delete-btn {
        opacity: 0.6;
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
        opacity: 1;
      }

      .tree-item.selected .delete-btn {
        opacity: 1;
      }

      .delete-btn:hover {
        color: var(--error-color);
        opacity: 1;
      }

      .lock-btn {
        opacity: 0.7;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .lock-btn,
      .tree-item.selected .lock-btn {
        opacity: 1;
      }

      .lock-btn.locked {
        color: var(--warning-color);
      }

      .lock-btn:hover {
        background: rgba(var(--rgb-primary-color), 0.1);
      }

      .occupancy-btn {
        opacity: 0.7;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .occupancy-btn,
      .tree-item.selected .occupancy-btn {
        opacity: 1;
      }

      .occupancy-btn:hover {
        background: rgba(var(--rgb-primary-color), 0.1);
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
let Qe = ve;
customElements.get("ht-location-tree") || customElements.define("ht-location-tree", Qe);
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const In = Ji(class extends Zi {
  constructor(s) {
    if (super(s), s.type !== vt.PROPERTY && s.type !== vt.ATTRIBUTE && s.type !== vt.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
    if (!Yo(s)) throw Error("`live` bindings can only contain a single expression");
  }
  render(s) {
    return s;
  }
  update(s, [t]) {
    if (t === Y || t === P) return t;
    const e = s.element, i = s.name;
    if (s.type === vt.PROPERTY) {
      if (t === e[i]) return Y;
    } else if (s.type === vt.BOOLEAN_ATTRIBUTE) {
      if (!!t === e.hasAttribute(i)) return Y;
    } else if (s.type === vt.ATTRIBUTE && e.getAttribute(i) === t + "") return Y;
    return to(s), t;
  }
}), ct = 30 * 60, Ri = 5 * 60;
function mo(s) {
  if (!s) return "";
  const t = s.indexOf(".");
  return t >= 0 ? s.slice(0, t) : "";
}
function Pn(s) {
  return ["door", "garage_door", "opening", "window"].includes(s || "");
}
function Rn(s) {
  return ["presence", "occupancy"].includes(s || "");
}
function On(s) {
  return s === "motion";
}
function vo(s) {
  return s === "media_player";
}
function yo(s) {
  var i;
  const t = mo(s == null ? void 0 : s.entity_id), e = (i = s == null ? void 0 : s.attributes) == null ? void 0 : i.device_class;
  if (vo(t))
    return {
      entity_id: (s == null ? void 0 : s.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: ct,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "light" || t === "switch")
    return {
      entity_id: (s == null ? void 0 : s.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: ct,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "person" || t === "device_tracker")
    return {
      entity_id: (s == null ? void 0 : s.entity_id) || "",
      mode: "specific_states",
      on_event: "trigger",
      on_timeout: null,
      off_event: "clear",
      off_trailing: Ri
    };
  if (t === "binary_sensor") {
    if (Rn(e))
      return {
        entity_id: (s == null ? void 0 : s.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: null,
        off_event: "clear",
        off_trailing: Ri
      };
    if (On(e))
      return {
        entity_id: (s == null ? void 0 : s.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: ct,
        off_event: "none",
        off_trailing: 0
      };
    if (Pn(e))
      return {
        entity_id: (s == null ? void 0 : s.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: ct,
        off_event: "none",
        off_trailing: 0
      };
  }
  return {
    entity_id: (s == null ? void 0 : s.entity_id) || "",
    mode: "any_change",
    on_event: "trigger",
    on_timeout: ct,
    off_event: "none",
    off_trailing: 0
  };
}
function Fe(s, t, e) {
  const i = mo(e == null ? void 0 : e.entity_id), o = yo(e);
  if (vo(i)) {
    const a = s.on_timeout && s.on_timeout > 0 ? s.on_timeout : ct;
    return {
      ...s,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: a,
      off_event: "none",
      off_trailing: 0
    };
  }
  if (t === "any_change") {
    const a = s.on_timeout ?? (o.mode === "any_change" ? o.on_timeout : ct);
    return {
      ...s,
      mode: t,
      on_event: "trigger",
      on_timeout: a,
      off_event: "none",
      off_trailing: 0
    };
  }
  const n = o.mode === "specific_states" ? o : {
    ...o,
    on_event: "trigger",
    on_timeout: ct,
    off_event: "none",
    off_trailing: 0
  };
  return {
    ...s,
    mode: t,
    on_event: s.on_event ?? n.on_event,
    on_timeout: s.on_timeout ?? n.on_timeout,
    off_event: s.off_event ?? n.off_event,
    off_trailing: s.off_trailing ?? n.off_trailing
  };
}
const bo = "topomation_", je = "[topomation]", Mn = "topomation/actions/rules/list", Nn = "topomation/actions/rules/create", Bn = "topomation/actions/rules/delete";
function Fn(s) {
  if (!s || typeof s != "object") return;
  const t = s;
  if (typeof t.code == "string" && t.code.trim())
    return t.code.trim().toLowerCase();
  if (typeof t.error == "string" && t.error.trim())
    return t.error.trim().toLowerCase();
}
function ci(s) {
  const t = Fn(s);
  if (t && ["unknown_command", "not_found", "invalid_format", "unknown_error"].includes(t))
    return !0;
  const e = wo(s).toLowerCase();
  return e.includes("unknown_command") || e.includes("unknown command") || e.includes("unsupported") || e.includes("not loaded") || e.includes("not_loaded") || e.includes("invalid handler");
}
function me(s) {
  return new Error(
    `Topomation managed-action backend is unavailable for ${s}. Reload Home Assistant to ensure this integration version is fully active.`
  );
}
function jn(s) {
  if (typeof s != "string" || !s.includes(je))
    return null;
  const t = s.split(/\r?\n/).map((e) => e.trim()).filter(Boolean);
  for (const e of t) {
    if (!e.startsWith(je)) continue;
    const i = e.slice(je.length).trim();
    if (!i) return null;
    try {
      const o = JSON.parse(i);
      if (typeof (o == null ? void 0 : o.location_id) == "string" && ((o == null ? void 0 : o.trigger_type) === "occupied" || (o == null ? void 0 : o.trigger_type) === "vacant"))
        return {
          version: Number(o.version) || 1,
          location_id: o.location_id,
          trigger_type: o.trigger_type,
          require_dark: typeof o.require_dark == "boolean" ? o.require_dark : void 0
        };
    } catch {
      return null;
    }
  }
  return null;
}
function zn(s) {
  var r, c;
  const t = (s == null ? void 0 : s.actions) ?? (s == null ? void 0 : s.action), e = Array.isArray(t) ? t[0] : t;
  if (!e || typeof e != "object")
    return {};
  const i = typeof e.action == "string" ? e.action : "", o = i.includes(".") ? i.split(".").slice(1).join(".") : i, n = (r = e == null ? void 0 : e.target) == null ? void 0 : r.entity_id;
  if (typeof n == "string")
    return {
      action_entity_id: n,
      action_service: o || void 0
    };
  if (Array.isArray(n) && typeof n[0] == "string")
    return {
      action_entity_id: n[0],
      action_service: o || void 0
    };
  const a = (c = e == null ? void 0 : e.data) == null ? void 0 : c.entity_id;
  return typeof a == "string" ? {
    action_entity_id: a,
    action_service: o || void 0
  } : {
    action_service: o || void 0
  };
}
function Un(s) {
  const t = (s == null ? void 0 : s.conditions) ?? (s == null ? void 0 : s.condition), e = Array.isArray(t) ? [...t] : t ? [t] : [];
  for (; e.length > 0; ) {
    const i = e.pop();
    if (!i || typeof i != "object") continue;
    if (i.condition === "state" && i.entity_id === "sun.sun" && i.state === "below_horizon")
      return !0;
    const o = i.conditions;
    Array.isArray(o) && e.push(...o);
  }
  return !1;
}
async function Wn(s) {
  try {
    const t = await s.callWS({ type: "config/entity_registry/list" });
    return Array.isArray(t) ? {
      entries: t.filter((e) => !e || typeof e.entity_id != "string" ? !1 : (typeof e.domain == "string" ? e.domain : String(e.entity_id).split(".", 1)[0]) === "automation"),
      usedStateFallback: !1
    } : {
      entries: [],
      usedStateFallback: !1
    };
  } catch (t) {
    return console.debug("[ha-automation-rules] entity_registry list unavailable; falling back to hass.states", t), {
      entries: Object.keys(s.states || {}).filter((e) => e.startsWith("automation.")).map((e) => ({ entity_id: e })),
      usedStateFallback: !0
    };
  }
}
function Kn(s, t) {
  const e = typeof (t == null ? void 0 : t.id) == "string" ? t.id.trim() : "";
  if (e) return e;
  const i = typeof s.unique_id == "string" ? s.unique_id.trim() : "";
  if (i) return i;
}
function Hn(s) {
  return !!((typeof s.unique_id == "string" ? s.unique_id.trim().toLowerCase() : "").startsWith(bo) || (Array.isArray(s.labels) ? s.labels : []).some(
    (o) => typeof o == "string" && o.toLowerCase().includes("topomation")
  ) || Object.values(s.categories || {}).some(
    (o) => typeof o == "string" && o.toLowerCase().includes("topomation")
  ));
}
function qn(s) {
  return Object.entries(s.states || {}).some(([t, e]) => {
    var o;
    if (!t.startsWith("automation.")) return !1;
    const i = (o = e == null ? void 0 : e.attributes) == null ? void 0 : o.id;
    return typeof i == "string" && i.trim().toLowerCase().startsWith(bo);
  });
}
function wo(s) {
  if (typeof s == "string" && s.trim()) return s.trim();
  if (s instanceof Error && s.message.trim()) return s.message.trim();
  if (s && typeof s == "object" && "message" in s) {
    const t = s.message;
    if (typeof t == "string" && t.trim())
      return t.trim();
  }
  return "unknown automation/config error";
}
async function Vn(s, t) {
  const i = (await Wn(s)).entries, o = i.filter(Hn), n = o.length > 0 ? o : i, a = [], c = (await Promise.all(
    n.map(async (d) => {
      var p, f;
      if (d.entity_id)
        try {
          const u = await s.callWS({
            type: "automation/config",
            entity_id: d.entity_id
          }), _ = u == null ? void 0 : u.config;
          if (!_ || typeof _ != "object")
            return;
          const v = jn(_.description);
          if (!v || v.location_id !== t)
            return;
          const y = Kn(d, _), $ = zn(_), A = (p = s.states) == null ? void 0 : p[d.entity_id], S = A ? A.state !== "off" : !0, F = typeof _.alias == "string" && _.alias.trim() || ((f = A == null ? void 0 : A.attributes) == null ? void 0 : f.friendly_name) || d.entity_id;
          return {
            id: y || d.entity_id,
            entity_id: d.entity_id,
            name: F,
            trigger_type: v.trigger_type,
            action_entity_id: $.action_entity_id,
            action_service: $.action_service,
            require_dark: typeof v.require_dark == "boolean" ? v.require_dark : Un(_),
            enabled: S
          };
        } catch (u) {
          a.push({
            entity_id: d.entity_id,
            error: u
          }), console.debug("[ha-automation-rules] failed to read automation config", d.entity_id, u);
          return;
        }
    })
  )).filter((d) => !!d).sort((d, p) => d.name.localeCompare(p.name)), l = n.length > 0 && a.length === n.length, h = o.length > 0 || qn(s);
  if (c.length === 0 && l && h) {
    const d = a[0], p = d ? wo(d.error) : "unknown reason";
    throw new Error(`Unable to read Topomation automation configs: ${p}`);
  }
  return c;
}
async function Gn(s, t, e) {
  try {
    const i = await s.callWS({
      type: Mn,
      location_id: t,
      ...e ? { entry_id: e } : {}
    });
    if (Array.isArray(i == null ? void 0 : i.rules))
      return [...i.rules].sort((o, n) => o.name.localeCompare(n.name));
  } catch (i) {
    if (!ci(i))
      throw i;
  }
  return Vn(s, t);
}
async function Yn(s, t, e) {
  try {
    const i = await s.callWS({
      type: Nn,
      location_id: t.location.id,
      name: t.name,
      trigger_type: t.trigger_type,
      action_entity_id: t.action_entity_id,
      action_service: t.action_service,
      require_dark: !!t.require_dark,
      ...e ? { entry_id: e } : {}
    });
    if (i != null && i.rule)
      return {
        ...i.rule,
        require_dark: !!i.rule.require_dark
      };
  } catch (i) {
    throw ci(i) ? me("rule creation") : i;
  }
  throw me("rule creation");
}
async function Oi(s, t, e) {
  const i = typeof t == "string" ? t : t.id, o = typeof t == "string" ? void 0 : t.entity_id;
  try {
    const n = await s.callWS({
      type: Bn,
      automation_id: i,
      ...o ? { entity_id: o } : {},
      ...e ? { entry_id: e } : {}
    });
    if ((n == null ? void 0 : n.success) === !0)
      return;
  } catch (n) {
    throw ci(n) ? me("rule deletion") : n;
  }
  throw me("rule deletion");
}
var Fi, ji;
try {
  (ji = (Fi = import.meta) == null ? void 0 : Fi.hot) == null || ji.accept(() => window.location.reload());
} catch {
}
const ye = class ye extends ut {
  constructor() {
    super(...arguments), this.allLocations = [], this.adjacencyEdges = [], this.entityRegistryRevision = 0, this.occupancyStates = {}, this.occupancyTransitions = {}, this.handoffTraces = [], this._activeTab = "detection", this._savingSource = !1, this._externalAreaId = "", this._externalEntityId = "", this._entityAreaById = {}, this._entityRegistryMetaById = {}, this._actionRules = [], this._loadingActionRules = !1, this._liveOccupancyStateByLocation = {}, this._nowEpochMs = Date.now(), this._actionToggleBusy = {}, this._actionServiceSelections = {}, this._actionDarkSelections = {}, this._savingLinkedLocations = !1, this._showAdvancedAdjacency = !1, this._adjacencyNeighborId = "", this._adjacencyBoundaryType = "door", this._adjacencyDirection = "bidirectional", this._adjacencyCrossingSources = "", this._adjacencyHandoffWindowSec = 12, this._adjacencyPriority = 50, this._savingAdjacency = !1, this._wiabInteriorEntityId = "", this._wiabDoorEntityId = "", this._wiabExteriorDoorEntityId = "", this._wiabShowAllEntities = !1, this._onTimeoutMemory = {}, this._actionRulesLoadSeq = 0, this._sourcePersistInFlight = !1, this._sourcePersistQueued = !1, this._linkedPersistChain = Promise.resolve(), this._linkedPersistQueueDepth = 0;
  }
  render() {
    return this.location ? g`
      <div class="inspector-container">
        ${this._renderHeader()} ${this._renderActionStartupConfig()} ${this._renderTabs()}
        ${this._renderContent()}
      </div>
    ` : g`
        <div class="empty-state">
          <div class="empty-state-icon">
            <ha-icon .icon=${"mdi:arrow-left"}></ha-icon>
          </div>
          <div>Select a location to view details</div>
        </div>
      `;
  }
  willUpdate(t) {
    var e;
    if (t.has("hass") && (this._entityAreaById = {}, this._entityAreaLoadPromise = void 0, this._liveOccupancyStateByLocation = {}, this.hass && (this._loadEntityAreaAssignments(), this._loadActionRules(), this._subscribeAutomationStateChanged())), t.has("forcedTab")) {
      const i = this._mapRequestedTab(this.forcedTab);
      i ? this._activeTab = i : t.get("forcedTab") && (this._activeTab = "detection");
    }
    if (t.has("location")) {
      const i = t.get("location"), o = (i == null ? void 0 : i.id) || "", n = ((e = this.location) == null ? void 0 : e.id) || "";
      o !== n && (this._resetSourceDraftState(), this._stagedLinkedLocations = void 0, this._externalAreaId = "", this._externalEntityId = "", this._wiabShowAllEntities = !1, this._showAdvancedAdjacency = !1, this._onTimeoutMemory = {}, this._actionToggleBusy = {}, this._actionServiceSelections = {}, this.hass && this._loadEntityAreaAssignments()), this._loadActionRules();
    }
    if (t.has("entryId")) {
      const i = t.get("entryId") || "", o = this.entryId || "";
      i !== o && this._loadActionRules();
    }
    t.has("entityRegistryRevision") && this._loadEntityAreaAssignments();
  }
  async _loadActionRules() {
    var i;
    const t = ++this._actionRulesLoadSeq, e = (i = this.location) == null ? void 0 : i.id;
    if (!e || !this.hass)
      return this._actionRules = [], this._loadingActionRules = !1, this._actionRulesError = void 0, !0;
    this._loadingActionRules = !0, this._actionRulesError = void 0, this.requestUpdate();
    try {
      const o = await Gn(this.hass, e, this.entryId);
      return t !== this._actionRulesLoadSeq ? !1 : (this._actionRules = o, !0);
    } catch (o) {
      return t !== this._actionRulesLoadSeq || (this._actionRulesError = (o == null ? void 0 : o.message) || "Failed to load automation rules"), !1;
    } finally {
      t === this._actionRulesLoadSeq && (this._loadingActionRules = !1, this.requestUpdate());
    }
  }
  async _loadEntityAreaAssignments() {
    var t;
    this._entityAreaLoadPromise || !((t = this.hass) != null && t.callWS) || (this._entityAreaLoadPromise = (async () => {
      try {
        const [e, i] = await Promise.all([
          this.hass.callWS({ type: "config/entity_registry/list" }),
          this.hass.callWS({ type: "config/device_registry/list" })
        ]), o = /* @__PURE__ */ new Map();
        if (Array.isArray(i))
          for (const r of i) {
            const c = typeof (r == null ? void 0 : r.id) == "string" ? r.id : void 0, l = typeof (r == null ? void 0 : r.area_id) == "string" ? r.area_id : void 0;
            c && l && o.set(c, l);
          }
        const n = {}, a = {};
        if (Array.isArray(e))
          for (const r of e) {
            const c = typeof (r == null ? void 0 : r.entity_id) == "string" ? r.entity_id : void 0;
            if (!c) continue;
            const l = typeof (r == null ? void 0 : r.area_id) == "string" ? r.area_id : void 0, h = typeof (r == null ? void 0 : r.device_id) == "string" ? o.get(r.device_id) : void 0;
            n[c] = l || h || null, a[c] = {
              hiddenBy: typeof (r == null ? void 0 : r.hidden_by) == "string" ? r.hidden_by : null,
              disabledBy: typeof (r == null ? void 0 : r.disabled_by) == "string" ? r.disabled_by : null,
              entityCategory: typeof (r == null ? void 0 : r.entity_category) == "string" ? r.entity_category : null
            };
          }
        this._entityAreaById = n, this._entityRegistryMetaById = a;
      } catch {
        this._entityAreaById = {}, this._entityRegistryMetaById = {};
      } finally {
        this._entityAreaLoadPromise = void 0, this.requestUpdate();
      }
    })(), await this._entityAreaLoadPromise);
  }
  _renderHeader() {
    if (!this.location) return "";
    const t = this.location.ha_area_id, e = t ? "HA Area ID" : "Location ID", i = t || this.location.id, o = this._getLockState(), n = this._getOccupancyState(), a = this._resolveOccupiedState(n), r = a === !0, c = a === !0 ? "Occupied" : a === !1 ? "Vacant" : "Unknown", l = this._resolveVacancyReason(n, a), h = n ? this._resolveVacantAt(n.attributes || {}, r) : void 0, d = r ? this._formatVacantAtLabel(h) : void 0;
    return g`
      <div class="header">
        <div class="header-main">
          <div class="header-icon">
            <ha-icon .icon=${this._headerIcon(this.location)}></ha-icon>
          </div>
          <div class="header-content">
            <div class="location-name">${this.location.name}</div>
            <div class="header-status">
              <span
                class="status-chip ${r ? "occupied" : "vacant"}"
                data-testid="header-occupancy-status"
              >
                ${c}
              </span>
              <span
                class="status-chip ${o.isLocked ? "locked" : ""}"
                data-testid="header-lock-status"
              >
                ${o.isLocked ? "Locked" : "Unlocked"}
              </span>
              ${r ? g`
                    <span class="header-vacant-at" data-testid="header-vacant-at">
                      Vacant at ${d}
                    </span>
                  ` : ""}
              ${!r && l ? g`
                    <span class="header-vacancy-reason" data-testid="header-vacancy-reason">
                      ${l}
                    </span>
                  ` : ""}
            </div>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-row">
            <span class="meta-label">${e}</span>
            <span class="meta-value">${i}</span>
          </div>
        </div>
      </div>
    `;
  }
  _headerIcon(t) {
    var i, o, n;
    const e = t.ha_area_id;
    return e && ((n = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[e]) != null && n.icon) ? this.hass.areas[e].icon : _o(t);
  }
  _renderTabs() {
    return g`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "detection" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "detection", this.requestUpdate();
    }}
        >
          Detection
        </button>
        <button
          class="tab ${this._activeTab === "occupied_actions" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "occupied_actions", this.requestUpdate();
    }}
        >
          On Occupied
        </button>
        <button
          class="tab ${this._activeTab === "vacant_actions" ? "active" : ""}"
          @click=${() => {
      this._activeTab = "vacant_actions", this.requestUpdate();
    }}
        >
          On Vacant
        </button>
      </div>
    `;
  }
  _renderContent() {
    const t = this._effectiveTab();
    return g`
      <div class="tab-content">
        ${t === "detection" ? this._renderOccupancyTab() : this._renderActionsTab(t === "occupied_actions" ? "occupied" : "vacant")}
      </div>
    `;
  }
  _effectiveTab() {
    return this._activeTab;
  }
  _mapRequestedTab(t) {
    if (t === "detection") return "detection";
    if (t === "occupied_actions") return "occupied_actions";
    if (t === "vacant_actions") return "vacant_actions";
    if (t === "occupancy") return "detection";
    if (t === "actions") return "occupied_actions";
  }
  connectedCallback() {
    super.connectedCallback(), this._startClockTicker(), this._subscribeAutomationStateChanged();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._stopClockTicker(), this._resetSourceDraftState(), this._actionRulesReloadTimer && (window.clearTimeout(this._actionRulesReloadTimer), this._actionRulesReloadTimer = void 0), this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0);
  }
  _scheduleActionRulesReload(t = 250) {
    this._actionRulesReloadTimer && (window.clearTimeout(this._actionRulesReloadTimer), this._actionRulesReloadTimer = void 0), this._actionRulesReloadTimer = window.setTimeout(() => {
      this._actionRulesReloadTimer = void 0, this._loadActionRules();
    }, t);
  }
  async _subscribeAutomationStateChanged() {
    var t, e;
    if (this._unsubAutomationStateChanged && (this._unsubAutomationStateChanged(), this._unsubAutomationStateChanged = void 0), !!((e = (t = this.hass) == null ? void 0 : t.connection) != null && e.subscribeEvents))
      try {
        this._unsubAutomationStateChanged = await this.hass.connection.subscribeEvents(
          (i) => {
            var l, h, d, p;
            const o = (l = i == null ? void 0 : i.data) == null ? void 0 : l.entity_id, n = (h = i == null ? void 0 : i.data) == null ? void 0 : h.new_state, a = (d = i == null ? void 0 : i.data) == null ? void 0 : d.old_state, r = (n == null ? void 0 : n.attributes) || {}, c = (a == null ? void 0 : a.attributes) || {};
            if (typeof o == "string" && o.startsWith("binary_sensor.")) {
              const f = typeof r.location_id == "string" ? r.location_id : void 0, u = typeof c.location_id == "string" ? c.location_id : void 0, _ = f || u, v = r.device_class === "occupancy", y = c.device_class === "occupancy";
              if (_ && (v || y)) {
                if (n && v)
                  this._liveOccupancyStateByLocation = {
                    ...this._liveOccupancyStateByLocation,
                    [_]: n
                  };
                else {
                  const { [_]: $, ...A } = this._liveOccupancyStateByLocation;
                  this._liveOccupancyStateByLocation = A;
                }
                ((p = this.location) == null ? void 0 : p.id) === _ && this.requestUpdate();
              }
            }
            typeof o != "string" || !o.startsWith("automation.") || this._scheduleActionRulesReload();
          },
          "state_changed"
        );
      } catch {
      }
  }
  _renderOccupancyTab() {
    if (!this.location) return "";
    const t = this.location.modules.occupancy || {}, e = this._isFloorLocation(), i = !!this.location.ha_area_id, o = this._isSiblingAreaSourceScope(), n = (t.occupancy_sources || []).length, a = this._getLockState();
    return e ? g`
        <div>
          <div class="card-section">
            <div class="section-title">
              <ha-icon .icon=${"mdi:layers"}></ha-icon>
              Floor Occupancy Behavior
            </div>
            <div class="policy-note">
              Floors do not use direct occupancy sources. Floor occupancy is derived from child areas, so
              add sensors to those areas and use this floor for aggregated automation.
            </div>
          ${n > 0 ? g`
                  <div class="policy-warning">
                    This floor still has ${n} unsupported source${n === 1 ? "" : "s"} in
                    config. Floor sources are unsupported and should be moved to areas.
                  </div>
                ` : ""}
          </div>
          ${this._renderManagedShadowAreaSection()}
        </div>
      ` : g`
      <div>
        <div class="card-section">
          ${a.isLocked ? g`
            <div class="lock-banner">
              <div class="lock-title">Locked</div>
              <div class="lock-details">
                ${a.lockedBy.length ? g`Held by ${a.lockedBy.join(", ")}.` : g`Occupancy is currently held by a lock.`}
              </div>
              ${a.lockModes.length ? g`
                    <div class="runtime-note">
                      Modes: ${a.lockModes.map((r) => this._lockModeLabel(r)).join(", ")}
                    </div>
                  ` : ""}
              ${a.directLocks.length ? g`
                    <div class="lock-directive-list">
                      ${a.directLocks.map((r) => g`
                        <div class="lock-directive">
                          <span class="lock-pill">${r.sourceId}</span>
                          <span>${this._lockModeLabel(r.mode)}</span>
                          <span>${this._lockScopeLabel(r.scope)}</span>
                        </div>
                      `)}
                    </div>
                  ` : g`<div class="runtime-note">Inherited from an ancestor subtree lock.</div>`}
            </div>
          ` : ""}
          <div class="sources-heading">
            <div class="section-title">Sources</div>
            <div class="sources-inline-help">
              ${i ? "Select sensors in this area." : "Integration-owned location: choose sources from Home Assistant entities."}
            </div>
          </div>
          ${i ? "" : g`
                <div class="policy-note" style="margin-bottom: 10px; max-width: 820px;">
                  Tip: choose <strong>Any area / unassigned</strong> to browse all compatible entities.
                </div>
              `}
          ${this._renderAreaSensorList(t)}
          <div class="external-source-section">
            <div class="subsection-title">Add Source</div>
            <div class="subsection-help">
              ${i ? o ? "Need cross-area coverage? Add a source from a sibling area on this floor." : "Need cross-area coverage? Add a source from another area." : "Add a source from any HA area (including unassigned entities)."}
            </div>
            ${this._renderExternalSourceComposer(t)}
          </div>
        </div>
        ${this._renderSyncLocationsSection(t)}
        ${this._renderWiabSection(t)}
        ${this._renderAdjacencyAdvancedSection(t)}
        ${this._isManagedShadowHost() ? this._renderManagedShadowAreaSection() : ""}
      </div>
    `;
  }
  _isManagedShadowHost() {
    if (!this.location || this.location.is_explicit_root) return !1;
    const t = B(this.location);
    return t === "floor" || t === "building" || t === "grounds";
  }
  _currentManagedShadowAreaId() {
    var i;
    if (!this._isManagedShadowHost() || !this.location) return "";
    const e = (((i = this.location.modules) == null ? void 0 : i._meta) || {}).shadow_area_id;
    return typeof e == "string" ? e.trim() : "";
  }
  _managedShadowAreaById(t) {
    return (this.allLocations || []).find((e) => e.id === t);
  }
  _managedShadowAreaLabel(t) {
    var o, n, a;
    const e = this._managedShadowAreaById(t);
    return e ? (e.ha_area_id ? (a = (n = (o = this.hass) == null ? void 0 : o.areas) == null ? void 0 : n[e.ha_area_id]) == null ? void 0 : a.name : void 0) || e.name : t;
  }
  _renderManagedShadowAreaSection() {
    var l;
    if (!this._isManagedShadowHost() || !this.location) return "";
    const t = this.location.id, e = this._currentManagedShadowAreaId(), i = e ? this._managedShadowAreaById(e) : void 0, o = ((l = i == null ? void 0 : i.modules) == null ? void 0 : l._meta) || {}, n = String(o.role || "").trim().toLowerCase() === "managed_shadow", a = String(o.shadow_for_location_id || "").trim(), r = !!(i && i.ha_area_id && i.parent_id === t && n && a === t), c = e ? this._managedShadowAreaLabel(e) : "Not configured";
    return g`
      <div class="card-section" data-testid="managed-shadow-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
          Managed System Area
        </div>
        <div class="policy-note">
          Topomation owns this mapping. Assignments to this ${B(this.location)} are
          remapped to a managed shadow HA area for native area_id interoperability.
        </div>
        <div class="subsection-help">
          Current system area: ${c}
        </div>
        ${e ? "" : g`
              <div class="policy-warning">
                Missing managed system area. It will be created automatically during sync/reconciliation.
              </div>
            `}
        ${e && !r ? g`
              <div class="policy-warning">
                Managed system area metadata is inconsistent. Topomation will repair it on next reconciliation.
              </div>
            ` : ""}
      </div>
    `;
  }
  _linkedLocationFloorParentId() {
    if (!this.location || B(this.location) !== "area") return null;
    const t = this.location.parent_id ?? null;
    if (!t) return null;
    const e = (this.allLocations || []).find((i) => i.id === t);
    return !e || B(e) !== "floor" ? null : t;
  }
  _linkedLocationCandidates() {
    if (!this.location) return [];
    const t = this._linkedLocationFloorParentId();
    return t ? (this.allLocations || []).filter((e) => e.id !== this.location.id).filter((e) => (e.parent_id ?? null) === t).filter((e) => B(e) === "area").filter((e) => !this._isManagedShadowLocation(e)).sort((e, i) => e.name.localeCompare(i.name)) : [];
  }
  _isManagedShadowLocation(t) {
    var i;
    const e = ((i = t.modules) == null ? void 0 : i._meta) || {};
    return String(e.role || "").trim().toLowerCase() === "managed_shadow";
  }
  _normalizeLinkedLocationIds(t, e, i) {
    if (!Array.isArray(t))
      return [];
    const o = /* @__PURE__ */ new Set(), n = [];
    for (const a of t) {
      if (typeof a != "string") continue;
      const r = a.trim();
      !r || o.has(r) || i && r === i || e && !e.has(r) || (o.add(r), n.push(r));
    }
    return n;
  }
  _linkedLocationIds(t) {
    if (!this.location)
      return [];
    const e = new Set(this._linkedLocationCandidates().map((o) => o.id));
    if (e.size === 0)
      return [];
    const i = this._stagedLinkedLocations ?? t.linked_locations;
    return this._normalizeLinkedLocationIds(i, e, this.location.id);
  }
  _syncLocationIds(t) {
    if (!this.location)
      return [];
    const e = new Set(this._linkedLocationCandidates().map((o) => o.id));
    if (e.size === 0)
      return [];
    const i = this._stagedSyncLocations ?? t.sync_locations;
    return this._normalizeLinkedLocationIds(i, e, this.location.id);
  }
  _linkedLocationArraysEqual(t, e) {
    return !t || t.length !== e.length ? !1 : t.every((i, o) => i === e[o]);
  }
  _candidateLinkedLocationIds(t) {
    var i;
    const e = (((i = t.modules) == null ? void 0 : i.occupancy) || {}).linked_locations;
    return this._normalizeLinkedLocationIds(e, void 0, t.id);
  }
  _candidateSyncLocationIds(t) {
    var i;
    const e = (((i = t.modules) == null ? void 0 : i.occupancy) || {}).sync_locations;
    return this._normalizeLinkedLocationIds(e, void 0, t.id);
  }
  _isTwoWayLinked(t, e) {
    return !this.location || !e.has(t.id) ? !1 : this._candidateLinkedLocationIds(t).includes(this.location.id);
  }
  _persistLinkedLocationsFor(t, e) {
    var n;
    const o = {
      ...((n = t.modules) == null ? void 0 : n.occupancy) || {},
      linked_locations: e
    };
    return this.hass.callWS(
      this._withEntryId({
        type: "topomation/locations/set_module_config",
        location_id: t.id,
        module_id: "occupancy",
        config: o
      })
    ).then(() => {
      t.modules = t.modules || {}, t.modules.occupancy = o, this.requestUpdate();
    });
  }
  _persistSyncLocationsFor(t, e) {
    var n;
    const o = {
      ...((n = t.modules) == null ? void 0 : n.occupancy) || {},
      sync_locations: e
    };
    return this.hass.callWS(
      this._withEntryId({
        type: "topomation/locations/set_module_config",
        location_id: t.id,
        module_id: "occupancy",
        config: o
      })
    ).then(() => {
      t.modules = t.modules || {}, t.modules.occupancy = o, this.requestUpdate();
    });
  }
  _enqueueLinkedPersist(t) {
    this._linkedPersistQueueDepth += 1, this._savingLinkedLocations = !0, this._linkedPersistChain = this._linkedPersistChain.then(t).catch((e) => {
      const i = (e == null ? void 0 : e.message) || "Failed to save linked rooms";
      console.error("Failed to persist linked room update", e), this._showToast(i, "error");
    }).finally(() => {
      this._linkedPersistQueueDepth = Math.max(0, this._linkedPersistQueueDepth - 1), this._linkedPersistQueueDepth === 0 && (this._savingLinkedLocations = !1);
    });
  }
  _toggleLinkedLocation(t, e) {
    if (!this.location) return;
    const i = this.location, o = i.id, n = this._getOccupancyConfig(), a = new Set(this._linkedLocationIds(n));
    e ? a.add(t) : a.delete(t);
    const r = [...a].sort(
      (c, l) => this._locationName(c).localeCompare(this._locationName(l))
    );
    this._stagedLinkedLocations = r, this._enqueueLinkedPersist(async () => {
      var c;
      await this._persistLinkedLocationsFor(i, r), ((c = this.location) == null ? void 0 : c.id) === o && this._linkedLocationArraysEqual(this._stagedLinkedLocations, r) && (this._stagedLinkedLocations = void 0), this._showToast("Linked rooms updated", "success");
    });
  }
  _toggleSyncLocation(t, e) {
    if (!this.location) return;
    const i = this.location, o = i.id, n = this._getOccupancyConfig(), a = new Set(this._syncLocationIds(n)), r = new Set(this._candidateSyncLocationIds(t));
    e ? (a.add(t.id), r.add(o)) : (a.delete(t.id), r.delete(o));
    const c = [...a].sort(
      (h, d) => this._locationName(h).localeCompare(this._locationName(d))
    ), l = [...r].sort(
      (h, d) => this._locationName(h).localeCompare(this._locationName(d))
    );
    this._stagedSyncLocations = c, this._enqueueLinkedPersist(async () => {
      var h;
      await this._persistSyncLocationsFor(i, c), ((h = this.location) == null ? void 0 : h.id) === o && this._linkedLocationArraysEqual(this._stagedSyncLocations, c) && (this._stagedSyncLocations = void 0), await this._persistSyncLocationsFor(t, l), this._showToast(
        e ? `Synced occupancy with ${t.name}` : `Removed occupancy sync with ${t.name}`,
        "success"
      );
    });
  }
  _toggleTwoWayLinkedLocation(t, e) {
    if (!this.location) return;
    const i = this.location, o = i.id, n = this._getOccupancyConfig(), a = new Set(this._linkedLocationIds(n));
    let r;
    e && !a.has(t.id) && (a.add(t.id), r = [...a].sort(
      (h, d) => this._locationName(h).localeCompare(this._locationName(d))
    ), this._stagedLinkedLocations = r);
    const c = new Set(this._candidateLinkedLocationIds(t));
    e ? c.add(o) : c.delete(o);
    const l = [...c].sort(
      (h, d) => this._locationName(h).localeCompare(this._locationName(d))
    );
    this._enqueueLinkedPersist(async () => {
      var h;
      r && (await this._persistLinkedLocationsFor(i, r), ((h = this.location) == null ? void 0 : h.id) === o && this._linkedLocationArraysEqual(this._stagedLinkedLocations, r) && (this._stagedLinkedLocations = void 0)), await this._persistLinkedLocationsFor(t, l), this._showToast(
        e ? `Enabled two-way link with ${t.name}` : `Disabled two-way link with ${t.name}`,
        "success"
      );
    });
  }
  _renderSyncLocationsSection(t) {
    if (!this.location) return "";
    if (!!!this._linkedLocationFloorParentId())
      return g`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:link-lock"}></ha-icon>
            Sync Rooms
          </div>
          <div class="subsection-help">
            Sync Rooms is available only for area locations directly under a floor.
          </div>
        </div>
      `;
    const i = this._linkedLocationCandidates(), o = this._syncLocationIds(t), n = new Set(o), a = o.length ? o.map((r) => this._locationName(r)).join(", ") : "None";
    return g`
      <div class="card-section" data-testid="sync-rooms-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-lock"}></ha-icon>
          Sync Rooms
        </div>
        <div class="subsection-help">
          <strong>Recommended:</strong> synced rooms share the same occupancy state and timeout.
          Any occupancy change in one synced room is mirrored to all others.
        </div>
        <div class="linked-location-meta">Synced with: ${a}</div>
        ${i.length === 0 ? g`<div class="adjacency-empty">No sibling area candidates available on this floor.</div>` : g`
              <div class="linked-location-list">
                ${i.map((r) => {
      const c = n.has(r.id);
      return g`
                    <div class="linked-location-row">
                      <label class="linked-location-left">
                        <input
                          type="checkbox"
                          data-testid=${`sync-location-${r.id}`}
                          .checked=${c}
                          @change=${(l) => {
        const h = l.target;
        this._toggleSyncLocation(r, h.checked);
      }}
                        />
                        <span class="linked-location-name">${r.name}</span>
                      </label>
                    </div>
                  `;
    })}
              </div>
            `}
      </div>
    `;
  }
  _renderLinkedLocationsSection(t) {
    if (!this.location) return "";
    if (!!!this._linkedLocationFloorParentId())
      return g`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
            Directional Contributors
          </div>
          <div class="subsection-help">
            Directional contributors are available only for area locations directly under a floor.
          </div>
        </div>
      `;
    const i = this._linkedLocationCandidates(), o = this._linkedLocationIds(t), n = new Set(this._syncLocationIds(t)), a = new Set(o), r = o.length ? o.map((c) => this._locationName(c)).join(", ") : "None";
    return g`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
          Directional Contributors
        </div>
        <div class="subsection-help">
          Advanced: select locations that can contribute occupancy to this location directionally.
          Configure reverse direction from the other location if needed.
        </div>
        <div class="linked-location-meta">Contributors: ${r}</div>
        ${i.length === 0 ? g`<div class="adjacency-empty">No sibling area candidates available on this floor.</div>` : g`
              <div class="linked-location-list">
                ${i.map((c) => {
      const l = a.has(c.id), h = n.has(c.id), d = this._isTwoWayLinked(c, a);
      return g`
                    <div class="linked-location-row">
                      <label class="linked-location-left">
                        <input
                          type="checkbox"
                          data-testid=${`linked-location-${c.id}`}
                          .checked=${l}
                          ?disabled=${h}
                          @change=${(p) => {
        const f = p.target;
        this._toggleLinkedLocation(c.id, f.checked);
      }}
                        />
                        <span class="linked-location-name">${c.name}</span>
                      </label>
                      <label class="linked-location-right">
                        <input
                          type="checkbox"
                          data-testid=${`linked-location-two-way-${c.id}`}
                          .checked=${d}
                          ?disabled=${!l || h}
                          @change=${(p) => {
        const f = p.target;
        this._toggleTwoWayLinkedLocation(c, f.checked);
      }}
                        />
                        <span class="linked-location-two-way-label">2-way</span>
                      </label>
                    </div>
                  `;
    })}
              </div>
            `}
      </div>
    `;
  }
  _renderAdjacencyAdvancedSection(t) {
    const e = this._showAdvancedAdjacency;
    return g`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:beaker-outline"}></ha-icon>
          Advanced Occupancy Relationships
        </div>
        <div class="subsection-help">
          Directional contributors and movement handoff are advanced tools.
          Most homes should start with Sync Rooms.
        </div>
        <div class="advanced-toggle-row">
          <button
            class="button button-secondary"
            data-testid="adjacency-advanced-toggle"
            @click=${() => {
      this._showAdvancedAdjacency = !this._showAdvancedAdjacency;
    }}
          >
            ${e ? "Hide Advanced Controls" : "Show Advanced Controls"}
          </button>
        </div>
      </div>
      ${e ? g`${this._renderLinkedLocationsSection(t)} ${this._renderAdjacencySection()} ${this._renderHandoffTraceSection()}` : ""}
    `;
  }
  _adjacencyCandidates() {
    if (!this.location) return [];
    const t = B(this.location);
    if (t !== "area" && t !== "subarea")
      return [];
    const e = this.location.parent_id ?? null;
    return (this.allLocations || []).filter((i) => i.id !== this.location.id).filter((i) => (i.parent_id ?? null) === e).filter((i) => !this._isManagedShadowLocation(i)).filter((i) => {
      const o = B(i);
      return o === "area" || o === "subarea";
    }).sort((i, o) => i.name.localeCompare(o.name));
  }
  _connectedAdjacencyEdges() {
    if (!this.location) return [];
    const t = this.location.id;
    return (this.adjacencyEdges || []).filter(
      (e) => e && (e.from_location_id === t || e.to_location_id === t)
    ).sort((e, i) => {
      const o = this._adjacentLocationName(e), n = this._adjacentLocationName(i);
      return o.localeCompare(n);
    });
  }
  _adjacentLocationId(t) {
    return this.location ? t.from_location_id === this.location.id ? t.to_location_id : t.from_location_id : t.to_location_id;
  }
  _adjacentLocationName(t) {
    var i;
    const e = this._adjacentLocationId(t);
    return ((i = this.allLocations.find((o) => o.id === e)) == null ? void 0 : i.name) || e;
  }
  _edgeDirectionLabel(t) {
    if (!this.location) return t.directionality;
    if (t.directionality === "bidirectional") return "Two-way";
    const e = this.location.id;
    return t.directionality === "a_to_b" && t.from_location_id === e || t.directionality === "b_to_a" && t.to_location_id === e ? "Outbound" : "Inbound";
  }
  _parseCrossingSources(t) {
    return t.split(",").map((e) => e.trim()).filter((e) => e.length > 0);
  }
  _emitAdjacencyChanged() {
    this.dispatchEvent(
      new CustomEvent("adjacency-changed", {
        bubbles: !0,
        composed: !0
      })
    );
  }
  async _handleAdjacencyCreate() {
    var e;
    const t = this._adjacencyNeighborId || ((e = this._adjacencyCandidates()[0]) == null ? void 0 : e.id) || "";
    if (!(!this.location || !t || this._savingAdjacency)) {
      this._savingAdjacency = !0;
      try {
        let i = this.location.id, o = t, n = "bidirectional";
        this._adjacencyDirection === "outbound" ? n = "a_to_b" : this._adjacencyDirection === "inbound" && (i = t, o = this.location.id, n = "a_to_b"), await this.hass.callWS(
          this._withEntryId({
            type: "topomation/adjacency/create",
            from_location_id: i,
            to_location_id: o,
            directionality: n,
            boundary_type: this._adjacencyBoundaryType,
            crossing_sources: this._parseCrossingSources(this._adjacencyCrossingSources),
            handoff_window_sec: this._adjacencyHandoffWindowSec,
            priority: this._adjacencyPriority
          })
        ), this._adjacencyCrossingSources = "", this._showToast("Adjacency edge created", "success"), this._emitAdjacencyChanged();
      } catch (i) {
        console.error("Failed to create adjacency edge:", i), this._showToast((i == null ? void 0 : i.message) || "Failed to create adjacency edge", "error");
      } finally {
        this._savingAdjacency = !1;
      }
    }
  }
  async _handleAdjacencyDelete(t) {
    if (!(!t || this._savingAdjacency)) {
      this._savingAdjacency = !0;
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/adjacency/delete",
            edge_id: t
          })
        ), this._showToast("Adjacency edge deleted", "success"), this._emitAdjacencyChanged();
      } catch (e) {
        console.error("Failed to delete adjacency edge:", e), this._showToast((e == null ? void 0 : e.message) || "Failed to delete adjacency edge", "error");
      } finally {
        this._savingAdjacency = !1;
      }
    }
  }
  _renderAdjacencySection() {
    var a;
    if (!this.location) return "";
    const t = this._adjacencyCandidates(), e = this._connectedAdjacencyEdges(), i = this._adjacencyNeighborId || ((a = t[0]) == null ? void 0 : a.id) || "", o = !!i && !this._savingAdjacency, n = t.length === 0;
    return g`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:graph-outline"}></ha-icon>
          Adjacent Locations
        </div>
        <div class="subsection-help">
          Model pathways between neighboring locations so wasp-in-box handoffs can reason about movement.
        </div>

        ${e.length === 0 ? g`<div class="adjacency-empty">No adjacency edges for this location yet.</div>` : g`
              <div class="adjacency-list">
                ${e.map((r) => g`
                  <div class="adjacency-row">
                    <div class="adjacency-row-head">
                      <div class="adjacency-neighbor">${this._adjacentLocationName(r)}</div>
                      <button
                        class="button button-secondary adjacency-delete-btn"
                        ?disabled=${this._savingAdjacency}
                        @click=${() => this._handleAdjacencyDelete(r.edge_id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div class="adjacency-meta">
                      ${this._edgeDirectionLabel(r)} • ${r.boundary_type} •
                      handoff ${r.handoff_window_sec}s • priority ${r.priority}
                    </div>
                    ${Array.isArray(r.crossing_sources) && r.crossing_sources.length > 0 ? g`
                          <div class="adjacency-meta">
                            crossings: ${r.crossing_sources.join(", ")}
                          </div>
                        ` : ""}
                  </div>
                `)}
              </div>
            `}

        <div class="adjacency-form">
          <div class="adjacency-form-grid">
            <div class="adjacency-form-field">
              <label for="adjacency-neighbor">Neighbor</label>
                <select
                id="adjacency-neighbor"
                .value=${i}
                ?disabled=${n || this._savingAdjacency}
                @change=${(r) => {
      const c = r.target;
      this._adjacencyNeighborId = c.value;
    }}
              >
                ${t.map((r) => g`
                  <option value=${r.id}>${r.name}</option>
                `)}
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-direction">Direction</label>
              <select
                id="adjacency-direction"
                .value=${this._adjacencyDirection}
                ?disabled=${this._savingAdjacency}
                @change=${(r) => {
      const c = r.target;
      this._adjacencyDirection = c.value;
    }}
              >
                <option value="bidirectional">Two-way</option>
                <option value="outbound">This to neighbor</option>
                <option value="inbound">Neighbor to this</option>
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-boundary">Boundary</label>
              <select
                id="adjacency-boundary"
                .value=${this._adjacencyBoundaryType}
                ?disabled=${this._savingAdjacency}
                @change=${(r) => {
      const c = r.target;
      this._adjacencyBoundaryType = c.value;
    }}
              >
                <option value="door">Door</option>
                <option value="archway">Archway</option>
                <option value="corridor">Corridor</option>
                <option value="stairs">Stairs</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-handoff">Handoff Window (sec)</label>
              <input
                id="adjacency-handoff"
                type="number"
                min="1"
                max="300"
                .value=${String(this._adjacencyHandoffWindowSec)}
                ?disabled=${this._savingAdjacency}
                @input=${(r) => {
      const c = r.target, l = Number.parseInt(c.value || "12", 10);
      this._adjacencyHandoffWindowSec = Number.isNaN(l) ? 12 : Math.max(1, Math.min(300, l));
    }}
              />
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-priority">Priority</label>
              <input
                id="adjacency-priority"
                type="number"
                min="0"
                max="1000"
                .value=${String(this._adjacencyPriority)}
                ?disabled=${this._savingAdjacency}
                @input=${(r) => {
      const c = r.target, l = Number.parseInt(c.value || "50", 10);
      this._adjacencyPriority = Number.isNaN(l) ? 50 : Math.max(0, Math.min(1e3, l));
    }}
              />
            </div>
          </div>
          <div class="adjacency-form-field">
            <label for="adjacency-crossings">Crossing sources (comma-separated entity IDs)</label>
            <input
              id="adjacency-crossings"
              type="text"
              placeholder="binary_sensor.hallway_beam, binary_sensor.kitchen_door"
              .value=${this._adjacencyCrossingSources}
              ?disabled=${this._savingAdjacency}
              @input=${(r) => {
      const c = r.target;
      this._adjacencyCrossingSources = c.value;
    }}
            />
          </div>
          <div class="adjacency-form-actions">
            <button
              class="button button-primary"
              ?disabled=${!o || n}
              @click=${this._handleAdjacencyCreate}
            >
              Add Adjacency
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _locationName(t) {
    var e, i;
    return ((e = this.location) == null ? void 0 : e.id) === t ? this.location.name : ((i = this.allLocations.find((o) => o.id === t)) == null ? void 0 : i.name) || t;
  }
  _formatHandoffStatus(t) {
    const e = t.trim();
    return e ? e.split("_").filter((i) => i.length > 0).map((i) => i.charAt(0).toUpperCase() + i.slice(1)).join(" ") : "Unknown";
  }
  _renderHandoffTraceSection() {
    if (!this.location) return "";
    const t = Array.isArray(this.handoffTraces) ? this.handoffTraces : [];
    return g`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:swap-horizontal-bold"}></ha-icon>
          Handoff Trace
        </div>
        <div class="subsection-help">
          Recent adjacency handoff triggers touching this location. Use this to validate wasp-in-box
          movement assumptions and crossing-source tuning.
        </div>
        ${t.length === 0 ? g`<div class="adjacency-empty">No recent handoff traces for this location.</div>` : g`
              <div class="handoff-trace-list">
                ${t.map((e) => {
      const i = this._parseDateValue(e.timestamp), o = i ? this._formatDateTime(i) : e.timestamp, n = `${this._locationName(e.from_location_id)} -> ${this._locationName(e.to_location_id)}`, a = e.trigger_entity_id || e.trigger_source_id || "unknown";
      return g`
                    <div class="handoff-trace-row">
                      <div class="handoff-trace-head">
                        <span class="handoff-trace-route">${n}</span>
                        <span class="handoff-trace-time">${o}</span>
                      </div>
                      <div class="handoff-trace-meta">
                        ${this._formatHandoffStatus(e.status)} • ${e.boundary_type} • window
                        ${e.handoff_window_sec}s
                      </div>
                      <div class="handoff-trace-meta">trigger: ${a}</div>
                    </div>
                  `;
    })}
              </div>
            `}
      </div>
    `;
  }
  _renderRuntimeStatus(t) {
    const e = this._getOccupancyState(), i = this._resolveOccupiedState(e);
    if (!e && i === void 0)
      return g`
        <div class="runtime-summary">
          <div class="runtime-summary-head">
            <span class="status-chip">Occupancy sensor unavailable</span>
            ${t.isLocked ? g`<span class="status-chip locked">Locked</span>` : ""}
          </div>
        </div>
      `;
    const o = (e == null ? void 0 : e.attributes) || {}, n = i === !0, a = this._resolveVacantAt(o, n), r = i === !0 ? "Occupied" : i === !1 ? "Vacant" : "Unknown", c = n ? this._formatVacantAtLabel(a) : "-";
    return g`
      <div class="runtime-summary">
        <div class="runtime-summary-head">
          <span class="status-chip ${n ? "occupied" : "vacant"}">${r}</span>
          <span class="status-chip ${t.isLocked ? "locked" : ""}">
            ${t.isLocked ? "Locked" : "Unlocked"}
          </span>
        </div>
        <div class="runtime-summary-grid">
          <div class="runtime-summary-key">Vacant at</div>
          <div class="runtime-summary-value" data-testid="runtime-vacant-at">${c}</div>
          <div class="runtime-summary-key">Lock</div>
          <div class="runtime-summary-value">${t.isLocked ? "Locked" : "Unlocked"}</div>
        </div>
      </div>
    `;
  }
  _isMediaEntity(t) {
    return t.startsWith("media_player.");
  }
  _mediaSignalLabel(t) {
    return t === "color" ? "Color changes" : t === "power" ? "Power changes" : t === "level" ? "Brightness changes" : t === "volume" ? "Volume changes" : t === "mute" ? "Mute changes" : "Playback";
  }
  _signalDescription(t) {
    return t === "color" ? "RGB/color changes" : t === "power" ? "on/off" : t === "level" ? "brightness changes" : t === "volume" ? "volume changes" : t === "mute" ? "mute/unmute" : "playback start/stop";
  }
  _sourceKey(t, e) {
    return e ? `${t}::${e}` : t;
  }
  _sourceKeyFromSource(t) {
    const e = this._normalizedSignalKeyForSource(t);
    return this._sourceKey(t.entity_id, e);
  }
  _sourceCardGroupKey(t) {
    const e = this._normalizedSignalKey(t.entityId, t.signalKey);
    return t.entityId.startsWith("light.") && (e === "power" || e === "level" || e === "color") ? `${t.entityId}::power-level` : t.entityId.startsWith("media_player.") && (e === "playback" || e === "volume" || e === "mute") ? `${t.entityId}::media-signals` : t.key;
  }
  _isLightSignalKey(t) {
    return t === "power" || t === "level" || t === "color";
  }
  _isMediaSignalKey(t) {
    return t === "playback" || t === "volume" || t === "mute";
  }
  _isIntegratedLightGroup(t) {
    return t.length > 1 && t[0].entityId.startsWith("light.") && t.every((e) => e.entityId === t[0].entityId);
  }
  _isIntegratedMediaGroup(t) {
    return t.length > 1 && t[0].entityId.startsWith("media_player.") && t.every((e) => e.entityId === t[0].entityId);
  }
  _defaultSignalKeyForEntity(t) {
    if (this._isMediaEntity(t)) return "playback";
    if (this._isDimmableEntity(t) || this._isColorCapableEntity(t)) return "power";
  }
  _candidateItemsForEntity(t) {
    if (!this._isMediaEntity(t)) {
      const e = this._isDimmableEntity(t), i = this._isColorCapableEntity(t);
      if (!e && !i)
        return [{ key: this._sourceKey(t), entityId: t }];
      const o = ["power"];
      return e && o.push("level"), i && o.push("color"), o.map((n) => ({
        key: this._sourceKey(t, n),
        entityId: t,
        signalKey: n
      }));
    }
    return ["playback", "volume", "mute"].map((e) => ({
      key: this._sourceKey(t, e),
      entityId: t,
      signalKey: e
    }));
  }
  _signalSortWeight(t) {
    return !t || t === "power" || t === "playback" ? 0 : t === "level" || t === "volume" ? 1 : t === "color" || t === "mute" ? 2 : 3;
  }
  _candidateTitle(t, e) {
    const i = this._normalizedSignalKey(t, e), o = this._entityName(t);
    return i && (t.startsWith("media_player.") || t.startsWith("light.")) ? `${o} — ${this._mediaSignalLabel(i)}` : !this._isMediaEntity(t) && !this._isDimmableEntity(t) && !this._isColorCapableEntity(t) ? o : `${o} — ${this._mediaSignalLabel(i)}`;
  }
  _normalizedSignalKeyForSource(t) {
    var o;
    const e = (o = t.source_id) != null && o.includes("::") ? t.source_id.split("::")[1] : void 0, i = t.signal_key || e;
    return this._normalizedSignalKey(t.entity_id, i);
  }
  _normalizedSignalKey(t, e) {
    return e || this._defaultSignalKeyForEntity(t);
  }
  _mediaSignalDefaults(t, e) {
    return e === "playback" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "playback"),
      signal_key: "playback",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : {
      entity_id: t,
      source_id: this._sourceKey(t, e),
      signal_key: e,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    };
  }
  _lightSignalDefaults(t, e) {
    return e === "power" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "power"),
      signal_key: "power",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : e === "color" ? {
      entity_id: t,
      source_id: this._sourceKey(t, "color"),
      signal_key: "color",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    } : {
      entity_id: t,
      source_id: this._sourceKey(t, "level"),
      signal_key: "level",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0
    };
  }
  _isDimmableEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const o = e.attributes || {};
    if (typeof o.brightness == "number") return !0;
    const n = o.supported_color_modes;
    return Array.isArray(n) ? n.some((c) => c && c !== "onoff") : !1;
  }
  _isColorCapableEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const o = e.attributes || {};
    if (o.rgb_color || o.hs_color || o.xy_color) return !0;
    const n = o.supported_color_modes;
    return Array.isArray(n) ? n.some((c) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(c)) : !1;
  }
  _renderAreaSensorList(t) {
    if (!this.location) return "";
    const e = !!this.location.ha_area_id, i = this._workingSources(t), o = /* @__PURE__ */ new Map();
    i.forEach((u, _) => o.set(this._sourceKeyFromSource(u), _));
    const r = [...this.location.entity_ids || []].sort(
      (u, _) => this._entityName(u).localeCompare(this._entityName(_))
    ).filter((u) => this._isCoreAreaSourceEntity(u)).flatMap(
      (u) => this._candidateItemsForEntity(u)
    ), c = r, l = new Set(r.map((u) => u.key)), h = i.filter((u) => !l.has(this._sourceKeyFromSource(u))).map((u) => ({
      key: this._sourceKeyFromSource(u),
      entityId: u.entity_id,
      signalKey: this._normalizedSignalKeyForSource(u)
    })), d = [...c, ...h].sort((u, _) => {
      const v = o.has(u.key), y = o.has(_.key);
      if (v !== y) return v ? -1 : 1;
      const $ = this._entityName(u.entityId).localeCompare(this._entityName(_.entityId));
      return $ !== 0 ? $ : this._signalSortWeight(u.signalKey) - this._signalSortWeight(_.signalKey);
    }), p = [], f = /* @__PURE__ */ new Map();
    for (const u of d) {
      const _ = this._sourceCardGroupKey(u), v = f.get(_);
      if (v) {
        v.items.push(u);
        continue;
      }
      const y = { key: _, items: [u] };
      f.set(_, y), p.push(y);
    }
    return p.length ? g`
      <div class="candidate-list">
        ${ae(p, (u) => u.key, (u) => {
      if (this._isIntegratedLightGroup(u.items))
        return this._renderIntegratedLightCard(t, u.items, i, o);
      if (this._isIntegratedMediaGroup(u.items))
        return this._renderIntegratedMediaCard(t, u.items, i, o);
      const _ = u.items.some((v) => o.has(v.key));
      return g`
            <div class="source-card ${_ ? "enabled" : ""}">
              ${ae(u.items, (v) => v.key, (v, y) => {
        const $ = o.get(v.key), A = $ !== void 0, S = A ? i[$] : void 0, F = A && S ? S : void 0, j = this._modeOptionsForEntity(v.entityId);
        return g`
                  <div class=${`source-card-item${y > 0 ? " grouped" : ""}`}>
                    <div class="candidate-item">
                      <div class="source-enable-control">
                        <input
                          type="checkbox"
                          class="source-enable-input"
                          aria-label="Include source"
                          .checked=${A}
                          @change=${(O) => {
          const X = O.target.checked;
          X && !A ? this._addSourceWithDefaults(v.entityId, t, {
            resetExternalPicker: !1,
            signalKey: v.signalKey
          }) || this.requestUpdate() : !X && A && this._removeSource($, t);
        }}
                        />
                      </div>
                      <div>
                        <div class="candidate-headline">
                          <div class="candidate-title">
                            ${this._candidateTitle(v.entityId, v.signalKey)}
                            <span class="candidate-entity-inline">[${v.entityId}]</span>
                          </div>
                          <div class="candidate-controls">
                            <span class="source-state-pill">${this._entityState(v.entityId)}</span>
                            ${A && F && j.length > 1 ? g`
                                  <div class="inline-mode-group">
                                    <span class="inline-mode-label">Mode</span>
                                    <select
                                      class="inline-mode-select"
                                      .value=${j.some((O) => O.value === F.mode) ? F.mode : j[0].value}
                                      @change=${(O) => {
          const X = O.target.value, M = this.hass.states[v.entityId], ht = Fe(F, X, M);
          this._updateSourceDraft(t, $, { ...ht, entity_id: F.entity_id });
        }}
                                    >
                                      ${j.map((O) => g`<option value=${O.value}>${O.label}</option>`)}
                                    </select>
                                  </div>
                                ` : ""}
                          </div>
                        </div>
                        ${(this._isMediaEntity(v.entityId) || v.entityId.startsWith("light.")) && v.signalKey ? g`<div class="candidate-submeta">Activity trigger: ${this._mediaSignalLabel(v.signalKey)}</div>` : ""}
                      </div>
                    </div>
                    ${A && S ? this._renderSourceEditor(t, S, $) : ""}
                  </div>
                `;
      })}
            </div>
          `;
    })}
      </div>
    ` : g`
        <div class="empty-state">
          <div class="text-muted">
            ${e ? g`No occupancy-relevant entities found yet. Add one from another area to get started.` : g`Add a source from Home Assistant entities below to get started.`}
          </div>
        </div>
      `;
  }
  _renderIntegratedLightCard(t, e, i, o) {
    var f;
    const n = (f = e[0]) == null ? void 0 : f.entityId;
    if (!n) return "";
    const a = [...e].filter((u) => this._isLightSignalKey(u.signalKey)).sort((u, _) => this._signalSortWeight(u.signalKey) - this._signalSortWeight(_.signalKey));
    if (a.length === 0) return "";
    const r = a.filter((u) => o.has(u.key)), c = r.length > 0, l = r.find((u) => u.signalKey === "power") || r[0] || a[0], h = o.get(l.key), d = h !== void 0 ? i[h] : void 0, p = this._modeOptionsForEntity(n);
    return g`
      <div class="source-card ${c ? "enabled" : ""}">
        <div class="source-card-item">
          <div class="candidate-item">
            <div class="source-enable-control">
              <input
                type="checkbox"
                class="source-enable-input"
                aria-label="Include light source"
                .checked=${c}
                @change=${(u) => {
      var v;
      const _ = u.target.checked;
      if (_ && !c) {
        const y = ((v = a.find((A) => A.signalKey === "power")) == null ? void 0 : v.signalKey) || a[0].signalKey;
        this._addSourceWithDefaults(n, t, {
          resetExternalPicker: !1,
          signalKey: y
        }) || this.requestUpdate();
        return;
      }
      !_ && c && this._removeSourcesByKey(
        a.map((y) => y.key),
        t
      );
    }}
              />
            </div>
            <div>
              <div class="candidate-headline">
                <div class="candidate-title">
                  ${this._entityName(n)}
                  <span class="candidate-entity-inline">[${n}]</span>
                </div>
                <div class="candidate-controls">
                  <span class="source-state-pill">${this._entityState(n)}</span>
                  ${d && h !== void 0 && p.length > 1 ? g`
                        <div class="inline-mode-group">
                          <span class="inline-mode-label">Mode</span>
                          <select
                            class="inline-mode-select"
                            .value=${p.some((u) => u.value === d.mode) ? d.mode : p[0].value}
                            @change=${(u) => {
      const _ = u.target.value, v = this.hass.states[n], y = Fe(d, _, v);
      this._updateSourceDraft(t, h, {
        ...y,
        entity_id: d.entity_id
      });
    }}
                          >
                            ${p.map((u) => g`<option value=${u.value}>${u.label}</option>`)}
                          </select>
                        </div>
                      ` : ""}
                </div>
              </div>
              <div class="candidate-submeta">Activity triggers</div>
              <div class="light-signal-toggles">
                ${a.map((u) => {
      const _ = o.has(u.key);
      return g`
                    <label class="light-signal-toggle">
                      <input
                        type="checkbox"
                        .checked=${_}
                        @change=${(v) => {
        const y = v.target.checked;
        if (y && !_) {
          this._addSourceWithDefaults(n, t, {
            resetExternalPicker: !1,
            signalKey: u.signalKey
          }) || this.requestUpdate();
          return;
        }
        !y && _ && this._removeSourcesByKey([u.key], t);
      }}
                      />
                      <span>${this._mediaSignalLabel(u.signalKey)}</span>
                    </label>
                  `;
    })}
              </div>
            </div>
          </div>
          ${d && h !== void 0 ? this._renderSourceEditor(t, d, h) : ""}
        </div>
      </div>
    `;
  }
  _renderIntegratedMediaCard(t, e, i, o) {
    var f;
    const n = (f = e[0]) == null ? void 0 : f.entityId;
    if (!n) return "";
    const a = [...e].filter((u) => this._isMediaSignalKey(u.signalKey)).sort((u, _) => this._signalSortWeight(u.signalKey) - this._signalSortWeight(_.signalKey));
    if (a.length === 0) return "";
    const r = a.filter((u) => o.has(u.key)), c = r.length > 0, l = r.find((u) => u.signalKey === "playback") || r[0] || a[0], h = o.get(l.key), d = h !== void 0 ? i[h] : void 0, p = this._modeOptionsForEntity(n);
    return g`
      <div class="source-card ${c ? "enabled" : ""}">
        <div class="source-card-item">
          <div class="candidate-item">
            <div class="source-enable-control">
              <input
                type="checkbox"
                class="source-enable-input"
                aria-label="Include media source"
                .checked=${c}
                @change=${(u) => {
      var v;
      const _ = u.target.checked;
      if (_ && !c) {
        const y = ((v = a.find((A) => A.signalKey === "playback")) == null ? void 0 : v.signalKey) || a[0].signalKey;
        this._addSourceWithDefaults(n, t, {
          resetExternalPicker: !1,
          signalKey: y
        }) || this.requestUpdate();
        return;
      }
      !_ && c && this._removeSourcesByKey(
        a.map((y) => y.key),
        t
      );
    }}
              />
            </div>
            <div>
              <div class="candidate-headline">
                <div class="candidate-title">
                  ${this._entityName(n)}
                  <span class="candidate-entity-inline">[${n}]</span>
                </div>
                <div class="candidate-controls">
                  <span class="source-state-pill">${this._entityState(n)}</span>
                  ${d && h !== void 0 && p.length > 1 ? g`
                        <div class="inline-mode-group">
                          <span class="inline-mode-label">Mode</span>
                          <select
                            class="inline-mode-select"
                            .value=${p.some((u) => u.value === d.mode) ? d.mode : p[0].value}
                            @change=${(u) => {
      const _ = u.target.value, v = this.hass.states[n], y = Fe(d, _, v);
      this._updateSourceDraft(t, h, {
        ...y,
        entity_id: d.entity_id
      });
    }}
                          >
                            ${p.map((u) => g`<option value=${u.value}>${u.label}</option>`)}
                          </select>
                        </div>
                      ` : ""}
                </div>
              </div>
              <div class="candidate-submeta">Activity triggers</div>
              <div class="light-signal-toggles">
                ${a.map((u) => {
      const _ = o.has(u.key);
      return g`
                    <label class="light-signal-toggle">
                      <input
                        type="checkbox"
                        .checked=${_}
                        @change=${(v) => {
        const y = v.target.checked;
        if (y && !_) {
          this._addSourceWithDefaults(n, t, {
            resetExternalPicker: !1,
            signalKey: u.signalKey
          }) || this.requestUpdate();
          return;
        }
        !y && _ && this._removeSourcesByKey([u.key], t);
      }}
                      />
                      <span>${this._mediaSignalLabel(u.signalKey)}</span>
                    </label>
                  `;
    })}
              </div>
            </div>
          </div>
          ${d && h !== void 0 ? this._renderSourceEditor(t, d, h) : ""}
        </div>
      </div>
    `;
  }
  _renderExternalSourceComposer(t) {
    var p;
    const e = this._availableSourceAreas(), i = this._isSiblingAreaSourceScope(), o = this._externalAreaId || "", n = o ? this._entitiesForArea(o) : [], a = this._externalEntityId || "", r = new Set(this._workingSources(t).map((f) => this._sourceKeyFromSource(f))), c = a ? this._defaultSignalKeyForEntity(a) : void 0, l = a ? this._sourceKey(a, c) : "", h = i ? "Sibling Area" : (p = this.location) != null && p.ha_area_id ? "Other Area" : "Source Area", d = i ? "Select sibling area..." : "Select area...";
    return g`
      <div class="external-composer">
        ${i ? g`<div class="runtime-note">Only sibling areas on this floor are available.</div>` : ""}
        ${i && e.length === 0 ? g`
              <div class="policy-warning">
                No sibling HA-backed areas are available for cross-area sources.
              </div>
            ` : ""}
        <div class="editor-field">
          <label for="external-source-area">${h}</label>
          <select
            id="external-source-area"
            data-testid="external-source-area-select"
            .value=${o}
            @change=${(f) => {
      const u = f.target.value;
      this._externalAreaId = u, this._externalEntityId = "", this.requestUpdate();
    }}
          >
            <option value="">${d}</option>
            ${i ? "" : g`<option value="__all__">Any area / unassigned</option>`}
            ${e.map((f) => g`<option value=${f.area_id}>${f.name}</option>`)}
          </select>
        </div>

        <div class="editor-field">
          <label for="external-source-entity">Sensor</label>
          <select
            id="external-source-entity"
            data-testid="external-source-entity-select"
            .value=${a}
            @change=${(f) => {
      this._externalEntityId = f.target.value, this.requestUpdate();
    }}
            ?disabled=${!o}
          >
            <option value="">Select sensor...</option>
            ${n.map((f) => g`
              <option
                value=${f}
                ?disabled=${r.has(this._sourceKey(f, this._defaultSignalKeyForEntity(f)))}
              >
                ${this._entityName(f)}${r.has(this._sourceKey(f, this._defaultSignalKeyForEntity(f))) ? " (already added)" : ""}
              </option>
            `)}
          </select>
        </div>

        <button
          class="button button-secondary"
          data-testid="add-external-source-inline"
          ?disabled=${this._savingSource || !a || (l ? r.has(l) : !1)}
          @click=${() => {
      this._addSourceWithDefaults(a, t, {
        resetExternalPicker: !0,
        signalKey: this._defaultSignalKeyForEntity(a)
      });
    }}
        >
          + Add Source
        </button>
      </div>
    `;
  }
  _renderWiabSection(t) {
    var h, d, p, f;
    const e = this._getWiabConfig(t), i = this._wiabInteriorCandidates(), o = this._wiabDoorCandidates(), n = ((h = this.location) == null ? void 0 : h.ha_area_id) || "", a = n ? ((f = (p = (d = this.hass) == null ? void 0 : d.areas) == null ? void 0 : p[n]) == null ? void 0 : f.name) || n : "", r = !!n && !this._wiabShowAllEntities, c = e.preset || "off";
    return g`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:box-shadow"}></ha-icon>
          Wasp In A Box
        </div>
        <div class="subsection-help">
          Preset occupancy latch behavior for enclosed rooms and whole-home containment.
          Use this when boundary sensors should hold occupancy until a release event occurs.
        </div>

        <div class="wiab-config">
          <div class="editor-field" style="max-width: 420px;">
            <label for="wiab-preset">Preset</label>
            <select
              id="wiab-preset"
              data-testid="wiab-preset-select"
              .value=${c}
              @change=${(u) => {
      const _ = this._normalizeWiabPreset(
        u.target.value
      ), v = this._defaultWiabTimeouts(_);
      this._updateConfig({
        ...t,
        wiab: {
          ...e,
          preset: _,
          hold_timeout_sec: v.hold_timeout_sec,
          release_timeout_sec: v.release_timeout_sec
        }
      });
    }}
            >
              <option value="off">Off</option>
              <option value="enclosed_room">Enclosed Room (Door Latch)</option>
              <option value="home_containment">Home Containment</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          ${c === "off" ? g`<div class="policy-note">WIAB is disabled for this location.</div>` : g`<div class="policy-note">Active preset: ${c === "enclosed_room" ? "Enclosed Room (Door Latch)" : c === "home_containment" ? "Home Containment" : c === "hybrid" ? "Hybrid" : "Off"}</div>`}

          ${c === "off" ? "" : g`
                ${n ? g`
                      <label class="editor-toggle">
                        <input
                          type="checkbox"
                          data-testid="wiab-show-all-toggle"
                          .checked=${this._wiabShowAllEntities}
                          @change=${(u) => {
      this._wiabShowAllEntities = u.target.checked;
    }}
                        />
                        Show entities from all areas
                      </label>
                      <div class="policy-note">
                        ${r ? `Showing ${a} entities by default.` : "Showing entities from all areas."}
                      </div>
                    ` : ""}

                ${this._renderWiabEntityEditor({
      label: "Interior entities",
      listKey: "interior_entities",
      candidates: i,
      selectedEntityId: this._wiabInteriorEntityId,
      setSelectedEntityId: (u) => {
        this._wiabInteriorEntityId = u;
      },
      config: t,
      testIdPrefix: "wiab-interior"
    })}

                ${c === "enclosed_room" || c === "hybrid" ? this._renderWiabEntityEditor({
      label: "Boundary door entities",
      listKey: "door_entities",
      candidates: o,
      selectedEntityId: this._wiabDoorEntityId,
      setSelectedEntityId: (u) => {
        this._wiabDoorEntityId = u;
      },
      config: t,
      testIdPrefix: "wiab-door"
    }) : ""}

                ${c === "home_containment" || c === "hybrid" ? this._renderWiabEntityEditor({
      label: "Exterior door entities",
      listKey: "exterior_door_entities",
      candidates: o,
      selectedEntityId: this._wiabExteriorDoorEntityId,
      setSelectedEntityId: (u) => {
        this._wiabExteriorDoorEntityId = u;
      },
      config: t,
      testIdPrefix: "wiab-exterior-door"
    }) : ""}

                <div class="wiab-grid">
                  <div class="editor-field">
                    <label for="wiab-hold-timeout">Hold timeout (sec)</label>
                    <input
                      id="wiab-hold-timeout"
                      data-testid="wiab-hold-timeout"
                      type="number"
                      min="0"
                      max="86400"
                      .value=${String(e.hold_timeout_sec ?? 0)}
                      @change=${(u) => {
      const _ = Number(u.target.value);
      this._updateWiabValue(t, "hold_timeout_sec", _);
    }}
                    />
                  </div>
                  <div class="editor-field">
                    <label for="wiab-release-timeout">Release timeout (sec)</label>
                    <input
                      id="wiab-release-timeout"
                      data-testid="wiab-release-timeout"
                      type="number"
                      min="0"
                      max="86400"
                      .value=${String(e.release_timeout_sec ?? 0)}
                      @change=${(u) => {
      const _ = Number(u.target.value);
      this._updateWiabValue(t, "release_timeout_sec", _);
    }}
                    />
                  </div>
                </div>
              `}
        </div>
      </div>
    `;
  }
  _renderWiabEntityEditor(t) {
    const i = this._getWiabConfig(t.config)[t.listKey] || [], o = new Set(i), n = t.candidates.filter((r) => !o.has(r)), a = o.has(t.selectedEntityId) ? "" : t.selectedEntityId;
    return g`
      <div class="wiab-entity-editor">
        <label>${t.label}</label>
        <div class="wiab-entity-input">
          <select
            data-testid=${`${t.testIdPrefix}-select`}
            .value=${a}
            @change=${(r) => {
      t.setSelectedEntityId(r.target.value), this.requestUpdate();
    }}
          >
            <option value="">Select entity...</option>
            ${n.map((r) => g`
              <option value=${r}>${this._entityName(r)} (${r})</option>
            `)}
          </select>
          <button
            class="button button-secondary"
            data-testid=${`${t.testIdPrefix}-add`}
            ?disabled=${!a}
            @click=${() => {
      this._addWiabEntity(t.config, t.listKey, a) && (t.setSelectedEntityId(""), this.requestUpdate());
    }}
          >
            Add
          </button>
        </div>

        ${i.length === 0 ? g`<div class="wiab-empty">No entities configured.</div>` : g`
              <div class="wiab-chip-list">
                ${i.map((r) => g`
                  <span class="wiab-chip" data-testid=${`${t.testIdPrefix}-chip`}>
                    ${this._entityName(r)}
                    <button
                      type="button"
                      aria-label="Remove entity"
                      data-testid=${`${t.testIdPrefix}-remove`}
                      @click=${() => this._removeWiabEntity(t.config, t.listKey, r)}
                    >
                      ×
                    </button>
                  </span>
                `)}
              </div>
            `}
      </div>
    `;
  }
  _getWiabConfig(t) {
    const e = t.wiab || {}, i = this._normalizeWiabPreset(e.preset), o = this._defaultWiabTimeouts(i);
    return {
      preset: i,
      interior_entities: this._normalizeWiabEntities(e.interior_entities),
      door_entities: this._normalizeWiabEntities(e.door_entities),
      exterior_door_entities: this._normalizeWiabEntities(e.exterior_door_entities),
      hold_timeout_sec: this._clampWiabSeconds(e.hold_timeout_sec, o.hold_timeout_sec),
      release_timeout_sec: this._clampWiabSeconds(e.release_timeout_sec, o.release_timeout_sec)
    };
  }
  _normalizeWiabPreset(t) {
    const e = String(t || "").trim().toLowerCase();
    return e === "enclosed_room" ? "enclosed_room" : e === "home_containment" ? "home_containment" : e === "hybrid" ? "hybrid" : "off";
  }
  _defaultWiabTimeouts(t) {
    return t === "home_containment" ? { hold_timeout_sec: 3600, release_timeout_sec: 120 } : t === "hybrid" ? { hold_timeout_sec: 1800, release_timeout_sec: 120 } : { hold_timeout_sec: 900, release_timeout_sec: 90 };
  }
  _normalizeWiabEntities(t) {
    if (!Array.isArray(t)) return [];
    const e = /* @__PURE__ */ new Set(), i = [];
    for (const o of t) {
      if (typeof o != "string") continue;
      const n = o.trim();
      !n || e.has(n) || (e.add(n), i.push(n));
    }
    return i;
  }
  _clampWiabSeconds(t, e) {
    const i = Number.parseInt(String(t ?? e), 10);
    return Number.isNaN(i) ? e : Math.max(0, Math.min(86400, i));
  }
  _updateWiabValue(t, e, i) {
    const o = this._getWiabConfig(t), n = o[e] ?? this._defaultWiabTimeouts(o.preset || "off")[e], a = this._clampWiabSeconds(i, n);
    this._updateConfig({
      ...t,
      wiab: {
        ...o,
        [e]: a
      }
    });
  }
  _addWiabEntity(t, e, i) {
    const o = i.trim();
    if (!o) return !1;
    const n = this._getWiabConfig(t), a = n[e] || [];
    return a.includes(o) ? !1 : (this._updateConfig({
      ...t,
      wiab: {
        ...n,
        [e]: [...a, o]
      }
    }), !0);
  }
  _removeWiabEntity(t, e, i) {
    const o = this._getWiabConfig(t), n = o[e] || [], a = n.filter((r) => r !== i);
    a.length !== n.length && this._updateConfig({
      ...t,
      wiab: {
        ...o,
        [e]: a
      }
    });
  }
  _wiabInteriorCandidates() {
    return this._wiabCandidates((t) => this._isCandidateEntity(t));
  }
  _wiabDoorCandidates() {
    return this._wiabCandidates((t) => this._isDoorBoundaryEntity(t));
  }
  _wiabCandidates(t) {
    var n, a;
    const e = ((n = this.hass) == null ? void 0 : n.states) || {}, i = (a = this.location) == null ? void 0 : a.ha_area_id;
    return (i && !this._wiabShowAllEntities ? this._wiabEntityIdsForArea(i) : Object.keys(e)).filter((r) => this._isCandidateEntity(r)).filter(t).sort((r, c) => this._entityName(r).localeCompare(this._entityName(c)));
  }
  _wiabEntityIdsForArea(t) {
    var o, n;
    const e = ((o = this.hass) == null ? void 0 : o.states) || {}, i = /* @__PURE__ */ new Set();
    for (const a of ((n = this.location) == null ? void 0 : n.entity_ids) || [])
      e[a] && i.add(a);
    for (const a of Object.keys(e))
      this._entityIsInArea(a, t) && i.add(a);
    return [...i];
  }
  _entityIsInArea(t, e) {
    var n, a, r;
    const i = ((n = this.hass) == null ? void 0 : n.states) || {}, o = this._entityAreaById[t];
    return o !== void 0 ? o === e : ((r = (a = i[t]) == null ? void 0 : a.attributes) == null ? void 0 : r.area_id) === e;
  }
  _isDoorBoundaryEntity(t) {
    var a, r, c;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e) return !1;
    const i = this._entityRegistryMetaById[t];
    if (i != null && i.hiddenBy || i != null && i.disabledBy || i != null && i.entityCategory || t.split(".", 1)[0] !== "binary_sensor") return !1;
    const n = String(((c = e.attributes) == null ? void 0 : c.device_class) || "").toLowerCase();
    return ["door", "garage_door", "opening", "window"].includes(n);
  }
  _renderSourceEditor(t, e, i) {
    const o = e, n = this._eventLabelsForSource(e), a = this._sourceKeyFromSource(e), r = this._supportsOffBehavior(e), c = t.default_timeout || 300, l = this._onTimeoutMemory[a], h = o.on_timeout === null ? l ?? c : o.on_timeout ?? l ?? c, d = Math.max(1, Math.min(120, Math.round(h / 60))), p = o.off_trailing ?? 0, f = Math.max(0, Math.min(120, Math.round(p / 60)));
    return g`
      <div class="source-editor">
        ${(this._isMediaEntity(e.entity_id) || e.entity_id.startsWith("light.")) && e.signal_key ? g`<div class="media-signals">Trigger signal: ${this._mediaSignalLabel(e.signal_key)} (${this._signalDescription(e.signal_key)}).</div>` : ""}
        <div class="editor-grid">
          <div class="editor-field">
            <div class="editor-label-row">
              <label for="source-on-event-${i}">${n.onBehavior}</label>
              <button
                class="mini-button"
                type="button"
                data-testid="source-test-on"
                ?disabled=${(o.on_event || "trigger") !== "trigger"}
                @click=${() => this._handleTestSource(o, "trigger")}
              >
                Test On
              </button>
            </div>
            <select
              id="source-on-event-${i}"
              .value=${o.on_event || "trigger"}
              @change=${(u) => {
      this._updateSourceDraft(t, i, {
        ...o,
        on_event: u.target.value
      });
    }}
            >
              <option value="trigger">Mark occupied</option>
              <option value="none">No change</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="source-on-timeout-${i}">${n.onTimeout}</label>
            <div class="editor-timeout">
              <input
                id="source-on-timeout-${i}"
                type="range"
                min="1"
                max="120"
                step="1"
                .value=${String(d)}
                ?disabled=${o.on_timeout === null}
                @input=${(u) => {
      const _ = Number(u.target.value) || 1;
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: _ * 60
      }, this._updateSourceDraft(t, i, { ...o, on_timeout: _ * 60 });
    }}
              />
              <input
                type="number"
                min="1"
                max="120"
                .value=${String(d)}
                ?disabled=${o.on_timeout === null}
                @change=${(u) => {
      const _ = Math.max(1, Math.min(120, Number(u.target.value) || 1));
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: _ * 60
      }, this._updateSourceDraft(t, i, { ...o, on_timeout: _ * 60 });
    }}
              />
              <span class="text-muted">min</span>
            </div>
            <label class="editor-toggle">
              <input
                type="checkbox"
                .checked=${o.on_timeout === null}
                @change=${(u) => {
      const _ = u.target.checked, v = this._onTimeoutMemory[a], y = d * 60, $ = v ?? y;
      _ && (this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [a]: o.on_timeout ?? $
      }), this._updateSourceDraft(t, i, {
        ...o,
        on_timeout: _ ? null : $
      });
    }}
              />
              Indefinite (until ${n.offState})
            </label>
          </div>

          ${r ? g`
                <div class="editor-field">
                  <div class="editor-label-row">
                    <label for="source-off-event-${i}">${n.offBehavior}</label>
                    <button
                      class="mini-button"
                      type="button"
                      data-testid="source-test-off"
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @click=${() => this._handleTestSource(o, "clear")}
                    >
                      Test Off
                    </button>
                  </div>
                  <select
                    id="source-off-event-${i}"
                    .value=${o.off_event || "none"}
                    @change=${(u) => {
      this._updateSourceDraft(t, i, {
        ...o,
        off_event: u.target.value
      });
    }}
                  >
                    <option value="none">No change</option>
                    <option value="clear">Mark vacant</option>
                  </select>
                </div>

                <div class="editor-field">
                  <label for="source-off-trailing-${i}">${n.offDelay}</label>
                  <div class="editor-timeout">
                    <input
                      id="source-off-trailing-${i}"
                      type="range"
                      min="0"
                      max="120"
                      step="1"
                      .value=${String(f)}
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @input=${(u) => {
      const _ = Math.max(0, Math.min(120, Number(u.target.value) || 0));
      this._updateSourceDraft(t, i, { ...o, off_trailing: _ * 60 });
    }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="120"
                      .value=${String(f)}
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @change=${(u) => {
      const _ = Math.max(0, Math.min(120, Number(u.target.value) || 0));
      this._updateSourceDraft(t, i, { ...o, off_trailing: _ * 60 });
    }}
                    />
                    <span class="text-muted">min</span>
                  </div>
                </div>
              ` : ""}
        </div>
      </div>
    `;
  }
  _renderActionsTab(t) {
    if (!this.location) return "";
    const e = this._actionTargetEntities(t), i = t === "occupied" ? "When Occupied" : "When Vacant", o = t === "occupied" ? "Rules in this tab run when occupancy changes to occupied." : "Rules in this tab run when occupancy changes to vacant.";
    return g`
      <div>
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:flash"}></ha-icon>
            ${i} device actions
          </div>

          <div class="subsection-help">
            Select the devices to manage in this tab. Media players intentionally support only
            Stop and Turn off here for common occupancy behavior.
            Use custom Home Assistant automations for advanced play/turn-on scenarios.
          </div>

          <div class="action-device-list">
            ${this._loadingActionRules ? g`
                  <div class="empty-state">
                    <div class="text-muted">Loading device actions...</div>
                  </div>
                ` : this._actionRulesError ? g`
                    <div class="empty-state">
                      <div class="text-muted">${this._actionRulesError}</div>
                    </div>
                  ` : e.length === 0 ? g`
                  <div class="empty-state">
                    <div class="text-muted">
                      No common controllable devices found for this location yet.
                    </div>
                  </div>
                ` : ae(
      e,
      (n) => n,
      (n) => {
        const a = this._isManagedActionEnabled(n, t), r = this._actionToggleKey(n, t), c = !!this._actionToggleBusy[r], l = this._selectedManagedActionService(n, t), h = this._selectedManagedActionRequireDark(n, t), d = this._supportsDarkCondition(t), p = this._actionServiceOptions(n, t);
        return g`
                    <div class="source-item action-device-row ${a ? "enabled" : ""}">
                      <div class="action-include-control">
                        <input
                          type="checkbox"
                          class="action-include-input"
                          .checked=${a}
                          ?disabled=${c || this._loadingActionRules}
                          aria-label=${`Include ${this._entityName(n)}`}
                          @change=${(f) => this._handleManagedActionToggle(
          n,
          t,
          f.target.checked
        )}
                        />
                      </div>
                      <div class="source-icon">
                        <ha-icon .icon=${this._deviceIcon(n)}></ha-icon>
                      </div>
                      <div class="source-info">
                        <div class="action-name-row">
                          <div class="source-name">${this._entityName(n)}</div>
                          <div class="action-entity-inline">${n}</div>
                        </div>
                        <div class="source-details">
                          State: ${this._entityState(n)}
                        </div>
                      </div>
                      <div class="action-controls">
                        <select
                          class="action-service-select"
                          .value=${In(l)}
                          ?disabled=${c || this._loadingActionRules}
                          @change=${(f) => this._handleManagedActionServiceChange(
          n,
          t,
          f.target.value
        )}
                        >
                          ${p.map(
          (f) => g`<option value=${f.value}>${f.label}</option>`
        )}
                        </select>
                        ${d ? g`
                              <label class="action-dark-toggle">
                                <input
                                  type="checkbox"
                                  class="action-dark-input"
                                  .checked=${h}
                                  ?disabled=${c || this._loadingActionRules}
                                  @change=${(f) => this._handleManagedActionDarkChange(
          n,
          t,
          f.target.checked
        )}
                                />
                                Only when dark
                              </label>
                            ` : ""}
                        ${c ? g`<span class="text-muted">Saving...</span>` : ""}
                      </div>
                    </div>
                  `;
      }
    )}
          </div>
        </div>

        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:information-outline"}></ha-icon>
            How it works
          </div>
          <div class="text-muted" style="font-size: 13px; line-height: 1.4;">
            ${o} Topomation creates tagged Home Assistant automations automatically.
          </div>
        </div>
      </div>
    `;
  }
  _renderActionStartupConfig() {
    const t = this._getAutomationConfig(), e = !!t.reapply_last_state_on_startup;
    return g`
      <div class="startup-inline">
        <label class="startup-inline-toggle">
          <input
            type="checkbox"
            class="switch-input"
            .checked=${e}
            @change=${(i) => {
      const o = i.target.checked;
      this._updateAutomationConfig({
        ...t,
        reapply_last_state_on_startup: o
      });
    }}
          />
          Reapply floor actions on startup
        </label>
        <div class="startup-inline-help">
          Re-runs both On Occupied and On Vacant actions after Home Assistant starts.
        </div>
      </div>
    `;
  }
  _actionToggleKey(t, e) {
    return `${e}:${t}`;
  }
  _actionTargetEntities(t) {
    if (!this.location) return [];
    const e = /* @__PURE__ */ new Set();
    for (const i of this.location.entity_ids || [])
      this._isActionDeviceEntity(i) && e.add(i);
    if (this.location.ha_area_id)
      for (const i of this._entitiesForArea(this.location.ha_area_id))
        this._isActionDeviceEntity(i) && e.add(i);
    return [...e].sort((i, o) => {
      const n = this._isManagedActionEnabled(i, t), a = this._isManagedActionEnabled(o, t);
      if (n !== a) return n ? -1 : 1;
      const r = this._actionDeviceType(i) || "zzzz", c = this._actionDeviceType(o) || "zzzz";
      return r !== c ? r.localeCompare(c) : this._entityName(i).localeCompare(this._entityName(o));
    });
  }
  _isActionDeviceEntity(t) {
    return !!this._actionDeviceType(t);
  }
  _actionDeviceType(t) {
    var h, d;
    const e = (d = (h = this.hass) == null ? void 0 : h.states) == null ? void 0 : d[t];
    if (!e) return;
    const i = t.split(".", 1)[0], o = e.attributes || {};
    if (i === "fan") return "fan";
    if (i === "media_player") {
      const p = String(o.device_class || "").toLowerCase(), f = `${o.friendly_name || ""} ${t}`.toLowerCase();
      return p === "tv" || /\btv\b/.test(f) || f.includes("television") ? "tv" : "stereo";
    }
    if (i !== "light") return;
    const n = Array.isArray(o.supported_color_modes) ? o.supported_color_modes : [], a = n.some(
      (p) => ["hs", "xy", "rgb", "rgbw", "rgbww", "color_temp"].includes(String(p))
    ), r = Array.isArray(o.hs_color) || Array.isArray(o.xy_color) || Array.isArray(o.rgb_color) || typeof o.color_temp_kelvin == "number" || typeof o.color_temp == "number";
    if (a || r) return "color_light";
    const c = n.some((p) => String(p) !== "onoff"), l = typeof o.brightness == "number" || typeof o.brightness_pct == "number" || typeof o.brightness_step == "number" || typeof o.brightness_step_pct == "number";
    return c || l ? "dimmer" : "light";
  }
  _actionDeviceTypeLabel(t) {
    return t === "light" ? "Light" : t === "dimmer" ? "Dimmer" : t === "color_light" ? "Color light" : t === "fan" ? "Fan" : t === "stereo" ? "Stereo" : t === "tv" ? "TV" : "Device";
  }
  _defaultManagedActionService(t, e) {
    return t.split(".", 1)[0] === "media_player" ? e === "occupied" ? "media_stop" : "turn_off" : e === "occupied" ? "turn_on" : "turn_off";
  }
  _actionServiceOptions(t, e) {
    const i = t.split(".", 1)[0];
    if (i === "cover")
      return [
        { value: "open_cover", label: "Open cover" },
        { value: "close_cover", label: "Close cover" },
        { value: "stop_cover", label: "Stop cover" }
      ];
    if (i === "media_player") {
      const n = this._defaultManagedActionService(t, e);
      return [
        { value: "media_stop", label: "Stop" },
        { value: "media_pause", label: "Pause" },
        { value: "turn_off", label: "Turn off" }
      ].sort((a, r) => a.value === n ? -1 : r.value === n ? 1 : 0);
    }
    const o = this._defaultManagedActionService(t, e);
    return [
      { value: "turn_on", label: "Turn on" },
      { value: "turn_off", label: "Turn off" }
    ].sort((n, a) => n.value === o ? -1 : a.value === o ? 1 : 0);
  }
  _actionServiceLabel(t) {
    return t.split("_").map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ");
  }
  _supportsDarkCondition(t) {
    return t === "occupied";
  }
  _selectedManagedActionService(t, e) {
    const i = this._actionToggleKey(t, e), o = this._defaultManagedActionService(t, e), n = this._actionServiceSelections[i];
    if (n) return n;
    const a = this._rulesForManagedActionEntity(t, e), r = a.find(
      (l) => l.enabled && typeof l.action_service == "string" && l.action_service.length > 0
    );
    if (r != null && r.action_service) return r.action_service;
    const c = a.find(
      (l) => typeof l.action_service == "string" && l.action_service.length > 0
    );
    return c != null && c.action_service ? c.action_service : o;
  }
  _selectedManagedActionRequireDark(t, e) {
    if (!this._supportsDarkCondition(e))
      return !1;
    const i = this._actionToggleKey(t, e);
    if (Object.prototype.hasOwnProperty.call(this._actionDarkSelections, i))
      return !!this._actionDarkSelections[i];
    const o = this._rulesForManagedActionEntity(t, e), n = o.find((r) => r.enabled);
    if (n)
      return !!n.require_dark;
    const a = o[0];
    return a ? !!a.require_dark : !1;
  }
  _rulesForManagedActionEntity(t, e) {
    return this._actionRules.filter(
      (i) => i.trigger_type === e && i.action_entity_id === t
    );
  }
  _isManagedActionEnabled(t, e) {
    return this._rulesForManagedActionEntity(t, e).some((i) => i.enabled);
  }
  _isManagedActionServiceSelected(t, e, i) {
    return this._rulesForManagedActionEntity(t, e).some(
      (o) => o.enabled && o.action_service === i
    );
  }
  _isManagedActionRequireDarkSelected(t, e, i) {
    return this._rulesForManagedActionEntity(t, e).some(
      (o) => o.enabled && !!o.require_dark === i
    );
  }
  async _reloadActionRulesUntil(t, e = 8, i = 250) {
    for (let o = 0; o < e; o += 1) {
      if (t() || await this._loadActionRules() && t())
        return !0;
      o < e - 1 && await new Promise((a) => window.setTimeout(a, i));
    }
    return !1;
  }
  _deviceIcon(t) {
    const e = this._actionDeviceType(t);
    return e === "light" ? "mdi:lightbulb-outline" : e === "dimmer" ? "mdi:lightbulb-on" : e === "color_light" ? "mdi:palette" : e === "fan" ? "mdi:fan" : e === "stereo" ? "mdi:speaker" : e === "tv" ? "mdi:television" : "mdi:robot";
  }
  _managedRuleName(t, e) {
    var r;
    const i = ((r = this.location) == null ? void 0 : r.name) || "Location", o = this._entityName(t), n = this._selectedManagedActionService(t, e).replace(/_/g, " ");
    return `${i} ${e === "occupied" ? "Occupied" : "Vacant"}: ${o} (${n})`;
  }
  async _replaceManagedActionRules(t, e, i, o) {
    if (!this.location) return;
    const n = this._rulesForManagedActionEntity(t, e);
    return n.length > 0 && await Promise.all(
      n.map((r) => Oi(this.hass, r, this.entryId))
    ), await Yn(this.hass, {
      location: this.location,
      name: this._managedRuleName(t, e),
      trigger_type: e,
      action_entity_id: t,
      action_service: i,
      require_dark: o
    }, this.entryId);
  }
  _setManagedActionRuleLocal(t, e, i, o, n) {
    const a = {
      ...t,
      trigger_type: i,
      action_entity_id: e,
      action_service: o,
      require_dark: n,
      enabled: !0
    }, r = this._actionRules.filter(
      (c) => !(c.trigger_type === i && c.action_entity_id === e)
    );
    this._actionRules = [...r, a];
  }
  _removeManagedActionRulesLocal(t, e) {
    this._actionRules = this._actionRules.filter(
      (i) => !(i.trigger_type === e && i.action_entity_id === t)
    );
  }
  async _handleManagedActionServiceChange(t, e, i) {
    var a;
    const o = this._actionToggleKey(t, e);
    if (this._actionServiceSelections = {
      ...this._actionServiceSelections,
      [o]: i
    }, !this._isManagedActionEnabled(t, e)) {
      this.requestUpdate();
      return;
    }
    this._actionToggleBusy = { ...this._actionToggleBusy, [o]: !0 }, this.requestUpdate();
    try {
      const r = this._selectedManagedActionRequireDark(t, e), c = await this._replaceManagedActionRules(
        t,
        e,
        i,
        r
      );
      c && this._setManagedActionRuleLocal(
        c,
        t,
        e,
        i,
        r
      ), await this._reloadActionRulesUntil(
        () => this._isManagedActionServiceSelected(t, e, i) && this._isManagedActionRequireDarkSelected(t, e, r)
      ) || this._showToast(
        "Saved, but Topomation could not verify the updated automation yet. Check browser console logs for details.",
        "error"
      );
    } catch (r) {
      console.error("Failed to update managed action service", {
        locationId: (a = this.location) == null ? void 0 : a.id,
        entityId: t,
        triggerType: e,
        actionService: i,
        error: r
      }), this._showToast((r == null ? void 0 : r.message) || "Failed to update automation", "error");
    } finally {
      const { [o]: r, ...c } = this._actionToggleBusy;
      this._actionToggleBusy = c, this.requestUpdate();
    }
  }
  async _handleManagedActionDarkChange(t, e, i) {
    var a;
    if (!this._supportsDarkCondition(e))
      return;
    const o = this._actionToggleKey(t, e);
    if (this._actionDarkSelections = {
      ...this._actionDarkSelections,
      [o]: i
    }, !this._isManagedActionEnabled(t, e)) {
      this.requestUpdate();
      return;
    }
    this._actionToggleBusy = { ...this._actionToggleBusy, [o]: !0 }, this.requestUpdate();
    try {
      const r = this._selectedManagedActionService(t, e), c = await this._replaceManagedActionRules(
        t,
        e,
        r,
        i
      );
      c && this._setManagedActionRuleLocal(
        c,
        t,
        e,
        r,
        i
      ), await this._reloadActionRulesUntil(
        () => this._isManagedActionServiceSelected(t, e, r) && this._isManagedActionRequireDarkSelected(t, e, i)
      ) || this._showToast(
        "Saved, but Topomation could not verify the updated automation yet. Check browser console logs for details.",
        "error"
      );
    } catch (r) {
      console.error("Failed to update managed action dark condition", {
        locationId: (a = this.location) == null ? void 0 : a.id,
        entityId: t,
        triggerType: e,
        requireDark: i,
        error: r
      }), this._showToast((r == null ? void 0 : r.message) || "Failed to update automation", "error");
    } finally {
      const { [o]: r, ...c } = this._actionToggleBusy;
      this._actionToggleBusy = c, this.requestUpdate();
    }
  }
  async _handleManagedActionToggle(t, e, i) {
    var n;
    if (!this.location) return;
    const o = this._actionToggleKey(t, e);
    this._actionToggleBusy = { ...this._actionToggleBusy, [o]: !0 }, this.requestUpdate();
    try {
      const a = this._rulesForManagedActionEntity(t, e), r = this._selectedManagedActionService(t, e), c = this._selectedManagedActionRequireDark(t, e);
      if (i) {
        const h = await this._replaceManagedActionRules(
          t,
          e,
          r,
          c
        );
        h && this._setManagedActionRuleLocal(
          h,
          t,
          e,
          r,
          c
        );
      } else a.length > 0 && (await Promise.all(
        a.map((h) => Oi(this.hass, h, this.entryId))
      ), this._removeManagedActionRulesLocal(t, e));
      await this._reloadActionRulesUntil(
        () => this._isManagedActionEnabled(t, e) === i && (!i || this._isManagedActionServiceSelected(t, e, r) && this._isManagedActionRequireDarkSelected(t, e, c))
      ) || this._showToast(
        "Saved, but Topomation could not verify the updated automation yet. Check browser console logs for details.",
        "error"
      );
    } catch (a) {
      console.error("Failed to update managed action rule", {
        locationId: (n = this.location) == null ? void 0 : n.id,
        entityId: t,
        triggerType: e,
        nextEnabled: i,
        error: a
      }), this._showToast((a == null ? void 0 : a.message) || "Failed to update automation", "error");
    } finally {
      const { [o]: a, ...r } = this._actionToggleBusy;
      this._actionToggleBusy = r, this.requestUpdate();
    }
  }
  _workingSources(t) {
    return this._stagedSources ? [...this._stagedSources] : [...t.occupancy_sources || []];
  }
  _setWorkingSources(t) {
    const e = t.map((o) => this._normalizeSource(o.entity_id, o)), i = { ...this._onTimeoutMemory };
    for (const o of e)
      typeof o.on_timeout == "number" && o.on_timeout > 0 && (i[this._sourceKeyFromSource(o)] = o.on_timeout);
    this._onTimeoutMemory = i, this._stagedSources = e, this._scheduleSourcePersist(), this.requestUpdate();
  }
  _updateSourceDraft(t, e, i) {
    const o = this._workingSources(t), n = o[e];
    if (!n) return;
    const a = this._modeOptionsForEntity(n.entity_id).map((c) => c.value), r = this._normalizeSource(
      n.entity_id,
      {
        ...i,
        mode: a.includes(i.mode) ? i.mode : a[0]
      }
    );
    o[e] = r, this._setWorkingSources(o);
  }
  _removeSource(t, e) {
    const i = this._workingSources(e), o = i[t];
    if (!o) return;
    i.splice(t, 1);
    const n = { ...this._onTimeoutMemory };
    delete n[this._sourceKeyFromSource(o)], this._onTimeoutMemory = n, this._setWorkingSources(i);
  }
  _removeSourcesByKey(t, e) {
    if (!t.length) return;
    const i = new Set(t), o = this._workingSources(e), n = o.filter((r) => !i.has(this._sourceKeyFromSource(r)));
    if (n.length === o.length) return;
    const a = { ...this._onTimeoutMemory };
    for (const r of o) {
      const c = this._sourceKeyFromSource(r);
      i.has(c) && delete a[c];
    }
    this._onTimeoutMemory = a, this._setWorkingSources(n);
  }
  _addSourceWithDefaults(t, e, i) {
    if (!this.location) return !1;
    if (this._isFloorLocation())
      return this._showToast("Floor locations do not support occupancy sources.", "error"), !1;
    const o = this._workingSources(e), n = this._sourceKey(t, i == null ? void 0 : i.signalKey);
    if (o.some((h) => this._sourceKeyFromSource(h) === n))
      return !1;
    const a = this.hass.states[t];
    if (!a)
      return this._showToast(`Entity not found: ${t}`, "error"), !1;
    let c = yo(a);
    (i == null ? void 0 : i.signalKey) === "playback" || (i == null ? void 0 : i.signalKey) === "volume" || (i == null ? void 0 : i.signalKey) === "mute" ? c = this._mediaSignalDefaults(t, i.signalKey) : ((i == null ? void 0 : i.signalKey) === "power" || (i == null ? void 0 : i.signalKey) === "level" || (i == null ? void 0 : i.signalKey) === "color") && (c = this._lightSignalDefaults(t, i.signalKey));
    const l = this._normalizeSource(t, c);
    return this._setWorkingSources([...o, l]), i != null && i.resetExternalPicker && (this._externalAreaId = "", this._externalEntityId = "", this.requestUpdate()), !0;
  }
  _resetSourceDraftState() {
    this._sourcePersistTimer && (window.clearTimeout(this._sourcePersistTimer), this._sourcePersistTimer = void 0), this._sourcePersistQueued = !1, this._stagedSources = void 0;
  }
  _scheduleSourcePersist(t = 250) {
    this._sourcePersistTimer && (window.clearTimeout(this._sourcePersistTimer), this._sourcePersistTimer = void 0), this._sourcePersistTimer = window.setTimeout(() => {
      this._sourcePersistTimer = void 0, this._flushSourcePersist();
    }, t);
  }
  async _flushSourcePersist() {
    var e;
    if (!this.location || !this._stagedSources) return;
    if (this._sourcePersistInFlight) {
      this._sourcePersistQueued = !0;
      return;
    }
    const t = this._stagedSources.map((i) => ({ ...i }));
    this._sourcePersistInFlight = !0, this._savingSource = !0, this.requestUpdate();
    try {
      await this._persistOccupancySources(t), this._sourcesEqual(this._stagedSources, t) && (this._stagedSources = void 0);
    } catch (i) {
      console.error("Failed to persist occupancy source changes", {
        locationId: (e = this.location) == null ? void 0 : e.id,
        error: i
      }), this._showToast((i == null ? void 0 : i.message) || "Failed to save source changes", "error");
    } finally {
      this._sourcePersistInFlight = !1, this._savingSource = !1, this.requestUpdate(), this._sourcePersistQueued && (this._sourcePersistQueued = !1, this._flushSourcePersist());
    }
  }
  _sourcesEqual(t, e) {
    return !t || t.length !== e.length ? !1 : t.every((i, o) => JSON.stringify(i) === JSON.stringify(e[o]));
  }
  async _persistOccupancySources(t) {
    if (!this.location) return;
    const e = this._getOccupancyConfig();
    await this._updateConfig({
      ...e,
      occupancy_sources: t
    });
  }
  _normalizeSource(t, e) {
    var d;
    const i = this._isMediaEntity(t), o = this._isDimmableEntity(t), n = this._isColorCapableEntity(t), a = (d = e.source_id) != null && d.includes("::") ? e.source_id.split("::")[1] : void 0, r = this._defaultSignalKeyForEntity(t), c = e.signal_key || a || r;
    let l;
    (i && (c === "playback" || c === "volume" || c === "mute") || (o || n) && (c === "power" || c === "level" || c === "color")) && (l = c);
    const h = e.source_id || this._sourceKey(t, l);
    return {
      entity_id: t,
      source_id: h,
      signal_key: l,
      mode: e.mode || "any_change",
      on_event: e.on_event || "trigger",
      on_timeout: e.on_timeout,
      off_event: e.off_event || "none",
      off_trailing: e.off_trailing ?? 0
    };
  }
  _getOccupancyConfig() {
    var t, e;
    return ((e = (t = this.location) == null ? void 0 : t.modules) == null ? void 0 : e.occupancy) || {};
  }
  _getAutomationConfig() {
    var t, e;
    return ((e = (t = this.location) == null ? void 0 : t.modules) == null ? void 0 : e.automation) || {};
  }
  async _updateAutomationConfig(t) {
    await this._updateModuleConfig("automation", t);
  }
  _availableSourceAreas() {
    var n, a;
    if (this._isSiblingAreaSourceScope())
      return this._siblingSourceAreas();
    const t = (n = this.location) == null ? void 0 : n.ha_area_id, e = this._managedShadowAreaIdSet(), i = ((a = this.hass) == null ? void 0 : a.areas) || {};
    return Object.values(i).filter((r) => !!r.area_id).filter((r) => r.area_id !== t).filter((r) => !e.has(r.area_id)).map((r) => ({
      area_id: r.area_id,
      name: r.name || r.area_id
    })).sort((r, c) => r.name.localeCompare(c.name));
  }
  _isSiblingAreaSourceScope() {
    if (!this.location || B(this.location) !== "area" || !this.location.ha_area_id) return !1;
    const t = this.allLocations || [];
    if (t.length === 0) return !1;
    const e = this.location.parent_id ?? null;
    if (!e) return !1;
    const i = t.find((o) => o.id === e);
    return !!i && B(i) === "floor";
  }
  _siblingSourceAreas() {
    if (!this.location || !this._isSiblingAreaSourceScope()) return [];
    const t = this.location.parent_id ?? null;
    if (!t) return [];
    const e = this.location.id, i = /* @__PURE__ */ new Set();
    return (this.allLocations || []).filter((o) => o.id !== e).filter((o) => (o.parent_id ?? null) === t).filter((o) => B(o) === "area").filter((o) => !this._isManagedShadowLocation(o)).filter((o) => !!o.ha_area_id).filter((o) => {
      const n = o.ha_area_id;
      return i.has(n) ? !1 : (i.add(n), !0);
    }).map((o) => ({
      area_id: o.ha_area_id,
      name: o.name || o.ha_area_id
    })).sort((o, n) => o.name.localeCompare(n.name));
  }
  _managedShadowAreaIdSet() {
    const t = /* @__PURE__ */ new Set();
    for (const e of this.allLocations || [])
      this._isManagedShadowLocation(e) && e.ha_area_id && t.add(e.ha_area_id);
    return t;
  }
  _entitiesForArea(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    return t === "__all__" ? Object.keys(e).filter((o) => this._isCandidateEntity(o)).sort((o, n) => this._entityName(o).localeCompare(this._entityName(n))) : Object.keys(e).filter((o) => {
      var a, r;
      const n = this._entityAreaById[o];
      return n !== void 0 ? n === t : ((r = (a = e[o]) == null ? void 0 : a.attributes) == null ? void 0 : r.area_id) === t;
    }).filter((o) => this._isCandidateEntity(o)).sort((o, n) => this._entityName(o).localeCompare(this._entityName(n)));
  }
  _isCandidateEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e) return !1;
    const i = this._entityRegistryMetaById[t];
    if (i != null && i.hiddenBy || i != null && i.disabledBy || i != null && i.entityCategory)
      return !1;
    const o = e.attributes || {};
    if (this._isTopomationOccupancyOutput(o)) return !1;
    const n = t.split(".", 1)[0];
    if (["person", "device_tracker", "light", "switch", "fan", "media_player"].includes(n))
      return !0;
    if (n === "binary_sensor") {
      const c = String(o.device_class || "");
      return c ? [
        "motion",
        "presence",
        "occupancy",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock",
        "vibration",
        "sound"
      ].includes(c) : !0;
    }
    return !1;
  }
  _isCoreAreaSourceEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t];
    if (!e) return !1;
    const i = this._entityRegistryMetaById[t];
    if (i != null && i.hiddenBy || i != null && i.disabledBy || i != null && i.entityCategory)
      return !1;
    const o = e.attributes || {};
    if (this._isTopomationOccupancyOutput(o)) return !1;
    const n = t.split(".", 1)[0];
    if (n === "light" || n === "fan" || n === "media_player")
      return !0;
    if (n === "switch")
      return this._isLightClassifiedSwitch(o);
    if (n === "binary_sensor") {
      const c = String(o.device_class || "");
      return c ? [
        "motion",
        "presence",
        "occupancy",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock",
        "vibration",
        "sound"
      ].includes(c) : !0;
    }
    return !1;
  }
  _isLightClassifiedSwitch(t) {
    return String(t.device_class || "").toLowerCase() === "light";
  }
  _isTopomationOccupancyOutput(t) {
    if (t.device_class !== "occupancy") return !1;
    const e = t.location_id;
    return typeof e == "string" && e.trim().length > 0;
  }
  _getOccupancyState() {
    var o;
    if (!this.location) return;
    const t = this.location.id, e = this._liveOccupancyStateByLocation[t];
    if (e)
      return e;
    const i = ((o = this.hass) == null ? void 0 : o.states) || {};
    for (const n of Object.values(i)) {
      const a = (n == null ? void 0 : n.attributes) || {};
      if (a.device_class === "occupancy" && a.location_id === this.location.id)
        return n;
    }
  }
  _resolveOccupiedState(t) {
    var o, n;
    const e = (o = this.location) == null ? void 0 : o.id, i = e ? (n = this.occupancyStates) == null ? void 0 : n[e] : void 0;
    if (typeof i == "boolean")
      return i;
    if (t) {
      if (t.state === "on")
        return !0;
      if (t.state === "off")
        return !1;
    }
  }
  _activeContributorsExcluding(t) {
    const e = this._getOccupancyState();
    if (((e == null ? void 0 : e.state) || "").toLowerCase() !== "on") return [];
    const i = (e == null ? void 0 : e.attributes) || {}, o = Array.isArray(i.contributions) ? i.contributions : [];
    if (!o.length) return [];
    const n = String(t || "").trim(), a = o.map((r) => String((r == null ? void 0 : r.source_id) || "").trim()).filter((r) => r.length > 0 && r !== n);
    return Array.from(new Set(a));
  }
  _getLockState() {
    const t = this._getOccupancyState(), e = (t == null ? void 0 : t.attributes) || {}, i = e.locked_by, o = e.lock_modes, n = e.direct_locks, a = Array.isArray(i) ? i.map((l) => String(l)) : [], r = Array.isArray(o) ? o.map((l) => String(l)) : [], c = Array.isArray(n) ? n.map((l) => ({
      sourceId: String((l == null ? void 0 : l.source_id) || "unknown"),
      mode: String((l == null ? void 0 : l.mode) || "freeze"),
      scope: String((l == null ? void 0 : l.scope) || "self")
    })).sort(
      (l, h) => `${l.sourceId}:${l.mode}:${l.scope}`.localeCompare(`${h.sourceId}:${h.mode}:${h.scope}`)
    ) : [];
    return {
      isLocked: !!e.is_locked,
      lockedBy: a,
      lockModes: r,
      directLocks: c
    };
  }
  _resolveVacantAt(t, e) {
    if (!e) return;
    const i = this._parseDateValue(t.vacant_at) || this._parseDateValue(t.effective_timeout_at);
    if (i)
      return i;
    const o = Array.isArray(t.contributions) ? t.contributions : [];
    if (!o.length)
      return;
    let n = !1, a;
    for (const r of o) {
      const c = r == null ? void 0 : r.expires_at;
      if (c == null) {
        n = !0;
        continue;
      }
      const l = this._parseDateValue(c);
      l && (!a || l.getTime() > a.getTime()) && (a = l);
    }
    return n ? null : a;
  }
  _formatVacantAtLabel(t) {
    return t instanceof Date ? this._formatDateTime(t) : "No timeout scheduled";
  }
  _resolveVacancyReason(t, e) {
    var a, r, c, l, h, d;
    if (e !== !1) return;
    const i = (a = this.location) == null ? void 0 : a.id;
    if (!i) return;
    const o = (c = (r = this.occupancyTransitions) == null ? void 0 : r[i]) == null ? void 0 : c.reason;
    if (((h = (l = this.occupancyTransitions) == null ? void 0 : l[i]) == null ? void 0 : h.occupied) === !1) {
      const p = this._formatVacancyReason(o);
      if (p) return p;
    }
    return this._formatVacancyReason((d = t == null ? void 0 : t.attributes) == null ? void 0 : d.reason);
  }
  _formatVacancyReason(t) {
    if (typeof t != "string") return;
    const e = t.trim();
    if (!e) return;
    const i = e.toLowerCase();
    if (i === "timeout")
      return "Vacated by timeout";
    if (i === "propagation:parent")
      return "Vacated by parent propagation";
    if (i.startsWith("propagation:child:"))
      return "Vacated by child propagation";
    if (i.startsWith("event:")) {
      const o = i.split(":", 2)[1];
      if (o === "clear") return "Vacated by clear event";
      if (o === "vacate") return "Vacated explicitly";
      if (o) return `Vacated by ${o} event`;
    }
    return `Vacancy reason: ${e}`;
  }
  _parseDateValue(t) {
    if (typeof t != "string" || !t) return;
    const e = new Date(t);
    return Number.isNaN(e.getTime()) ? void 0 : e;
  }
  _formatDateTime(t) {
    return new Intl.DateTimeFormat(void 0, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(t);
  }
  _formatRelativeDuration(t) {
    const e = Math.max(0, Math.floor((t.getTime() - this._nowEpochMs) / 1e3));
    if (e <= 0) return "now";
    const i = Math.floor(e / 86400), o = Math.floor(e % 86400 / 3600), n = Math.floor(e % 3600 / 60), a = e % 60, r = [];
    return i > 0 && r.push(`${i}d`), o > 0 && r.push(`${o}h`), n > 0 && r.length < 2 && r.push(`${n}m`), (r.length === 0 || i === 0 && o === 0 && n === 0) && r.push(`${a}s`), r.slice(0, 2).join(" ");
  }
  _lockModeLabel(t) {
    return t === "block_occupied" ? "Block occupied" : t === "block_vacant" ? "Block vacant" : "Freeze";
  }
  _lockScopeLabel(t) {
    return t === "subtree" ? "Subtree" : "Self";
  }
  _startClockTicker() {
    this._clockTimer === void 0 && (this._clockTimer = window.setInterval(() => {
      this._nowEpochMs = Date.now();
    }, 1e3));
  }
  _stopClockTicker() {
    this._clockTimer !== void 0 && (window.clearInterval(this._clockTimer), this._clockTimer = void 0);
  }
  _describeSource(t, e) {
    const i = t.mode === "any_change" ? "Any change" : "Specific states", o = t.on_timeout === null ? null : t.on_timeout ?? e, n = t.off_trailing ?? 0, a = t.on_event === "trigger" ? `ON: trigger (${this._formatDuration(o)})` : "ON: ignore", r = t.off_event === "clear" ? `OFF: clear (${this._formatDuration(n)})` : "OFF: ignore";
    return `${i} • ${a} • ${r}`;
  }
  _renderSourceEventChips(t, e) {
    const i = [], o = t.on_timeout === null ? null : t.on_timeout ?? e, n = t.off_trailing ?? 0;
    return t.on_event === "trigger" ? i.push(g`<span class="event-chip">ON -> trigger (${this._formatDuration(o)})</span>`) : i.push(g`<span class="event-chip ignore">ON ignored</span>`), t.off_event === "clear" ? i.push(
      g`<span class="event-chip off">OFF -> clear (${this._formatDuration(n)})</span>`
    ) : i.push(g`<span class="event-chip ignore">OFF ignored</span>`), i;
  }
  _modeOptionsForEntity(t) {
    var a, r;
    const e = (r = (a = this.hass) == null ? void 0 : a.states) == null ? void 0 : r[t], i = (e == null ? void 0 : e.attributes) || {}, o = t.split(".", 1)[0], n = String(i.device_class || "");
    return o === "person" || o === "device_tracker" ? [{ value: "specific_states", label: "Specific states" }] : o === "binary_sensor" ? [
      "door",
      "garage_door",
      "opening",
      "window",
      "motion",
      "presence",
      "occupancy",
      "vibration",
      "sound"
    ].includes(n) ? [{ value: "specific_states", label: "Specific states" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ] : ["light", "switch", "fan", "media_player"].includes(o) ? [{ value: "any_change", label: "Any change" }] : [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" }
    ];
  }
  _supportsOffBehavior(t) {
    const e = t.entity_id.split(".", 1)[0];
    return !(e === "media_player" && (t.signal_key === "volume" || t.signal_key === "mute") || e === "light" && (t.signal_key === "level" || t.signal_key === "color"));
  }
  _eventLabelsForSource(t) {
    var l, h;
    const e = t.entity_id, i = (h = (l = this.hass) == null ? void 0 : l.states) == null ? void 0 : h[e], o = (i == null ? void 0 : i.attributes) || {}, n = e.split(".", 1)[0], a = String(o.device_class || "");
    let r = "ON", c = "OFF";
    return n === "binary_sensor" && ["door", "garage_door", "opening", "window"].includes(a) ? (r = "Open", c = "Closed") : n === "binary_sensor" && a === "motion" ? (r = "Motion", c = "No motion") : n === "binary_sensor" && ["presence", "occupancy"].includes(a) ? (r = "Detected", c = "Not detected") : n === "person" || n === "device_tracker" ? (r = "Home", c = "Away") : n === "media_player" ? t.signal_key === "volume" ? (r = "Volume change", c = "No volume change") : t.signal_key === "mute" ? (r = "Mute change", c = "No mute change") : (r = "Playing", c = "Paused/idle") : n === "light" && t.signal_key === "level" ? (r = "Brightness change", c = "No brightness change") : n === "light" && t.signal_key === "color" ? (r = "Color change", c = "No color change") : (n === "light" && t.signal_key === "power" || n === "light" || n === "switch" || n === "fan") && (r = "On", c = "Off"), {
      onState: r,
      offState: c,
      onBehavior: "When activity is detected",
      onTimeout: "Occupied hold time",
      offBehavior: "When activity stops",
      offDelay: "Vacant delay"
    };
  }
  _formatDuration(t) {
    return t === null ? "indefinite" : !t || t <= 0 ? "0m" : `${Math.floor(t / 60)}m`;
  }
  _entityName(t) {
    var e, i;
    return ((i = (e = this.hass.states[t]) == null ? void 0 : e.attributes) == null ? void 0 : i.friendly_name) || t;
  }
  _entityState(t) {
    var i;
    const e = (i = this.hass.states[t]) == null ? void 0 : i.state;
    return e || "unknown";
  }
  async _handleTestSource(t, e) {
    if (!(!this.location || this._isFloorLocation()))
      try {
        if (e === "trigger") {
          const a = (this.location.modules.occupancy || {}).default_timeout || 300, r = t.on_timeout === null ? a : t.on_timeout ?? a, c = t.source_id || t.entity_id;
          await this.hass.callWS({
            type: "call_service",
            domain: "topomation",
            service: "trigger",
            service_data: this._serviceDataWithEntryId({
              location_id: this.location.id,
              source_id: c,
              timeout: r
            })
          }), this.dispatchEvent(
            new CustomEvent("source-test", {
              detail: {
                action: "trigger",
                locationId: this.location.id,
                sourceId: c,
                timeout: r
              },
              bubbles: !0,
              composed: !0
            })
          ), this._showToast(`Triggered ${c}`, "success");
          return;
        }
        const i = t.off_trailing ?? 0, o = t.source_id || t.entity_id, n = i <= 0;
        if (await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: n ? "vacate" : "clear",
          service_data: this._serviceDataWithEntryId(n ? {
            location_id: this.location.id
          } : {
            location_id: this.location.id,
            source_id: o,
            trailing_timeout: i
          })
        }), this.dispatchEvent(
          new CustomEvent("source-test", {
            detail: {
              action: n ? "vacate" : "clear",
              locationId: this.location.id,
              sourceId: o,
              trailing_timeout: i
            },
            bubbles: !0,
            composed: !0
          })
        ), n)
          this._showToast(`Vacated ${o}`, "success");
        else {
          const a = this._activeContributorsExcluding(o);
          if (a.length > 0) {
            const r = a.slice(0, 2).join(", "), c = a.length > 2 ? ` +${a.length - 2} more` : "";
            this._showToast(`Cleared ${o}; still occupied by ${r}${c}`, "error");
          } else
            this._showToast(`Cleared ${o}`, "success");
        }
      } catch (i) {
        console.error("Failed to test source event:", i), this._showToast((i == null ? void 0 : i.message) || "Failed to run source test", "error");
      }
  }
  _showToast(t, e = "success") {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: {
          message: t,
          type: e === "error" ? "error" : void 0
        },
        bubbles: !0,
        composed: !0
      })
    );
  }
  async _updateModuleConfig(t, e) {
    if (this.location)
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/set_module_config",
            location_id: this.location.id,
            module_id: t,
            config: e
          })
        ), this.location.modules[t] = e, this.requestUpdate();
      } catch (i) {
        console.error("Failed to update config:", i), alert("Failed to update configuration");
      }
  }
  _toggleEnabled(t) {
    if (!this.location || this._isFloorLocation()) return;
    const e = this.location.modules.occupancy || {}, i = !(e.enabled ?? !0);
    this._updateConfig({ ...e, enabled: i });
  }
  _withEntryId(t) {
    const e = typeof this.entryId == "string" ? this.entryId.trim() : "";
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _serviceDataWithEntryId(t) {
    const e = typeof this.entryId == "string" ? this.entryId.trim() : "";
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _handleTimeoutSliderInput(t) {
    const e = t.target, i = e.closest(".config-value");
    if (!i) return;
    const o = i.querySelector("input.input");
    o && (o.value = e.value);
  }
  _handleTimeoutChange(t) {
    const e = t.target, i = parseInt(e.value, 10);
    if (Number.isNaN(i)) return;
    const o = Math.max(1, Math.min(120, i));
    e.value = String(o);
    const n = o * 60, a = e.closest(".config-value");
    if (a) {
      const c = a.querySelector("input.timeout-slider");
      c && (c.value = String(o));
      const l = a.querySelector("input.input");
      l && (l.value = String(o));
    }
    if (!this.location || this._isFloorLocation()) return;
    const r = this.location.modules.occupancy || {};
    this._updateConfig({ ...r, default_timeout: n });
  }
  async _updateConfig(t) {
    await this._updateModuleConfig("occupancy", t);
  }
  _isFloorLocation() {
    return !!this.location && B(this.location) === "floor";
  }
};
ye.properties = {
  hass: { attribute: !1 },
  location: { attribute: !1 },
  allLocations: { attribute: !1 },
  adjacencyEdges: { attribute: !1 },
  entryId: { attribute: !1 },
  entityRegistryRevision: { type: Number },
  forcedTab: { type: String },
  occupancyStates: { attribute: !1 },
  occupancyTransitions: { attribute: !1 },
  handoffTraces: { attribute: !1 }
}, ye.styles = [
  Se,
  Xt`
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
        justify-content: space-between;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: rgba(var(--rgb-primary-color), 0.05);
        border-radius: var(--border-radius);
      }

      .header-main {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
        min-width: 0;
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
        min-width: 0;
      }

      .location-name {
        font-size: 24px;
        font-weight: 600;
        color: var(--primary-text-color);
        line-height: 1.2;
      }

      .header-status {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .header-vacant-at {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .header-vacancy-reason {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .header-meta {
        min-width: 180px;
        display: flex;
        justify-content: flex-end;
      }

      .meta-row {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: baseline;
        gap: 8px;
        margin-top: 4px;
      }

      .meta-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--secondary-text-color);
        text-align: right;
      }

      .meta-value {
        font-size: 12px;
        font-family: var(--code-font-family, monospace);
        color: var(--primary-text-color);
        text-align: right;
      }

      .runtime-summary {
        max-width: 900px;
        margin-bottom: var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
      }

      .runtime-summary-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .status-chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 2px 10px;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid var(--divider-color);
      }

      .status-chip.occupied {
        color: var(--success-color);
        border-color: rgba(var(--rgb-success-color), 0.35);
        background: rgba(var(--rgb-success-color), 0.08);
      }

      .status-chip.vacant {
        color: var(--text-secondary-color);
      }

      .status-chip.locked {
        color: var(--warning-color);
        border-color: rgba(var(--rgb-warning-color), 0.35);
        background: rgba(var(--rgb-warning-color), 0.08);
      }

      .runtime-summary-grid {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 6px 12px;
        max-width: 560px;
      }

      .runtime-summary-key {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .runtime-summary-value {
        font-size: 14px;
        color: var(--primary-text-color);
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

      .sources-heading {
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .sources-heading .section-title {
        margin-bottom: 0;
      }

      .sources-inline-help {
        color: var(--text-secondary-color);
        font-size: 12px;
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

      .config-help {
        margin-top: 3px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .startup-config-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 4px;
      }

      .startup-config-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .startup-config-row .config-help {
        margin-top: 0;
        max-width: 700px;
        line-height: 1.45;
      }

      .startup-config-row .config-value {
        flex: 0 0 auto;
      }

      .config-value {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        justify-self: start;
      }

      .switch-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .startup-inline {
        max-width: 900px;
        margin-bottom: var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
      }

      .startup-inline-toggle {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .startup-inline-help {
        margin-top: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .input {
        padding: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        font-size: 14px;
        width: 84px;
      }

      .timeout-slider {
        width: 240px;
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

      .action-device-list {
        display: grid;
        gap: var(--spacing-sm);
        max-width: 820px;
      }

      .action-device-row.enabled {
        border-color: rgba(var(--rgb-primary-color), 0.35);
        background: rgba(var(--rgb-primary-color), 0.05);
      }

      .action-device-row {
        grid-template-columns: 28px 24px minmax(0, 1fr) auto;
      }

      .action-include-control {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .action-include-input {
        appearance: auto;
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .action-include-input:focus-visible {
        outline: 2px solid rgba(var(--rgb-primary-color), 0.45);
        outline-offset: 2px;
      }

      .action-controls {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
      }

      .action-service-select {
        min-width: 170px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .action-dark-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
        cursor: pointer;
        user-select: none;
      }

      .action-dark-input {
        width: 14px;
        height: 14px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .service-pill {
        display: inline-flex;
        align-items: center;
        padding: 1px 8px;
        border-radius: 999px;
        background: rgba(var(--rgb-primary-color), 0.1);
        color: var(--primary-color);
        font-weight: 600;
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

      .action-name-row {
        display: flex;
        align-items: baseline;
        gap: 6px;
        flex-wrap: wrap;
      }

      .action-entity-inline {
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 500;
        font-family: var(--code-font-family, monospace);
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

      .lock-banner {
        margin: 0 0 var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid rgba(var(--rgb-warning-color), 0.4);
        border-radius: 8px;
        background: rgba(var(--rgb-warning-color), 0.1);
      }

      .lock-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--warning-color);
      }

      .lock-details {
        margin-top: 4px;
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .runtime-grid {
        display: grid;
        row-gap: 8px;
        margin-bottom: var(--spacing-md);
      }

      .runtime-row {
        display: grid;
        grid-template-columns: minmax(180px, 240px) 1fr;
        align-items: center;
        column-gap: 12px;
      }

      .runtime-key {
        font-size: 12px;
        font-weight: 700;
        color: var(--text-secondary-color);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .runtime-value {
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .runtime-note {
        margin-top: 8px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .lock-directive-list {
        margin-top: 8px;
        display: grid;
        gap: 6px;
      }

      .lock-directive {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 12px;
        color: var(--primary-text-color);
      }

      .lock-pill {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(var(--rgb-warning-color), 0.35);
        border-radius: 999px;
        padding: 2px 8px;
        color: var(--warning-color);
        background: rgba(var(--rgb-warning-color), 0.08);
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

      .source-card {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        overflow: hidden;
      }

      .source-card.enabled {
        border-color: rgba(var(--rgb-primary-color), 0.25);
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .source-card-item.grouped {
        border-top: 1px solid var(--divider-color);
      }

      .subsection-help {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary-color);
        font-size: 12px;
        max-width: 820px;
      }

      .linked-location-list {
        display: grid;
        gap: 8px;
        max-width: 820px;
      }

      .linked-location-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: rgba(var(--rgb-primary-color), 0.02);
      }

      .linked-location-left,
      .linked-location-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .linked-location-left {
        min-width: 0;
      }

      .linked-location-row input[type="checkbox"] {
        margin: 0;
      }

      .linked-location-name {
        font-size: 13px;
        font-weight: 600;
      }

      .linked-location-two-way-label {
        font-size: 12px;
        color: var(--text-secondary-color);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .linked-location-meta {
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .advanced-toggle-row {
        display: flex;
        justify-content: flex-end;
        max-width: 820px;
      }

      .adjacency-list {
        display: grid;
        gap: 8px;
        margin-bottom: 12px;
        max-width: 820px;
      }

      .adjacency-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .adjacency-row-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .adjacency-neighbor {
        font-size: 13px;
        font-weight: 600;
      }

      .adjacency-meta {
        margin-top: 4px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .adjacency-delete-btn {
        font-size: 11px;
        padding: 4px 8px;
      }

      .adjacency-empty {
        color: var(--text-secondary-color);
        font-size: 12px;
        margin-bottom: 8px;
      }

      .adjacency-form {
        display: grid;
        gap: 10px;
        max-width: 820px;
      }

      .adjacency-form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
      }

      .adjacency-form-field {
        display: grid;
        gap: 4px;
      }

      .adjacency-form-field label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .adjacency-form-field input,
      .adjacency-form-field select {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .adjacency-form-actions {
        display: flex;
        justify-content: flex-end;
      }

      .handoff-trace-list {
        display: grid;
        gap: 8px;
        max-width: 820px;
      }

      .handoff-trace-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.02);
      }

      .handoff-trace-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
      }

      .handoff-trace-route {
        font-weight: 700;
      }

      .handoff-trace-time {
        color: var(--text-secondary-color);
      }

      .handoff-trace-meta {
        margin-top: 4px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .candidate-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--spacing-md);
        align-items: center;
        padding: 8px 10px;
        border: none;
        border-radius: 0;
        background: transparent;
      }

      .candidate-item:hover {
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .candidate-title {
        font-size: 14px;
        font-weight: 600;
      }

      .candidate-entity-inline {
        margin-left: 4px;
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 500;
        font-family: var(--code-font-family, monospace);
      }

      .candidate-meta {
        margin-top: 4px;
        color: var(--text-secondary-color);
        font-size: 12px;
        font-family: var(--code-font-family, monospace);
      }

      .candidate-submeta {
        margin-top: 6px;
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 600;
      }

      .light-signal-toggles {
        margin-top: 6px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .light-signal-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--primary-text-color);
      }

      .light-signal-toggle input {
        width: 14px;
        height: 14px;
        accent-color: var(--primary-color);
      }

      .candidate-headline {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }

      .candidate-controls {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
      }

      .source-state-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid var(--divider-color);
        padding: 2px 8px;
        font-size: 11px;
        color: var(--text-secondary-color);
        text-transform: lowercase;
      }

      .inline-mode-select {
        min-width: 180px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .inline-mode-group {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .inline-mode-label {
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 600;
      }

      .source-enable-control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .source-enable-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .source-enable-input:focus-visible {
        outline: 2px solid rgba(var(--rgb-primary-color), 0.4);
        outline-offset: 2px;
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

      .source-editor {
        margin: 0;
        border: none;
        border-top: 1px solid rgba(var(--rgb-primary-color), 0.2);
        border-radius: 0;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.07);
      }

      .editor-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 8px 10px;
      }

      .media-signals {
        margin-bottom: 10px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .editor-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .editor-field label {
        font-size: 12px;
        color: var(--text-secondary-color);
        font-weight: 600;
      }

      .editor-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .editor-field select,
      .editor-field input[type="number"] {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .editor-timeout {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .editor-timeout input[type="range"] {
        flex: 1;
      }

      .editor-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .editor-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .sources-actions {
        margin-top: 10px;
        max-width: 820px;
      }

      .external-source-section {
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--divider-color);
        max-width: 820px;
      }

      .external-source-section .subsection-title {
        margin-bottom: 4px;
      }

      .external-source-section .subsection-help {
        margin-bottom: 10px;
      }

      .external-composer {
        display: grid;
        grid-template-columns: minmax(180px, 240px) minmax(220px, 1fr) auto;
        gap: 8px;
        align-items: end;
        max-width: 820px;
        margin-bottom: 10px;
      }

      .external-composer .editor-field {
        min-width: 0;
      }

      .wiab-config {
        display: grid;
        gap: 10px;
        max-width: 820px;
      }

      .wiab-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
      }

      .wiab-entity-editor {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 10px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .wiab-entity-editor label {
        display: block;
        margin-bottom: 6px;
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .wiab-entity-input {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
      }

      .wiab-entity-input select {
        min-width: 0;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .wiab-chip-list {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .wiab-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid var(--divider-color);
        border-radius: 999px;
        padding: 2px 8px;
        background: var(--card-background-color);
        font-size: 12px;
      }

      .wiab-chip button {
        border: none;
        background: transparent;
        color: var(--text-secondary-color);
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
      }

      .wiab-empty {
        margin-top: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
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
        .header {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-main {
          width: 100%;
        }

        .header-meta {
          width: 100%;
          min-width: 0;
        }

        .meta-label,
        .meta-value {
          text-align: left;
        }

        .runtime-summary-grid {
          grid-template-columns: 1fr;
          gap: 4px;
        }

        .config-row {
          grid-template-columns: 1fr;
          row-gap: 8px;
        }

        .startup-config-row {
          gap: 10px;
        }

        .startup-config-header {
          align-items: flex-start;
        }

        .editor-grid {
          grid-template-columns: 1fr;
        }

        .external-composer {
          grid-template-columns: 1fr;
        }

        .sources-heading {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
      }
    `
];
let Je = ye;
if (!customElements.get("ht-location-inspector"))
  try {
    customElements.define("ht-location-inspector", Je);
  } catch (s) {
    console.error("[ht-location-inspector] failed to define element", s);
  }
console.log("[ht-location-dialog] module loaded");
var zi, Ui;
try {
  (Ui = (zi = import.meta) == null ? void 0 : zi.hot) == null || Ui.accept(() => window.location.reload());
} catch {
}
const be = class be extends ut {
  constructor() {
    super(...arguments), this.open = !1, this.locations = [], this._config = {
      name: "",
      type: "area"
    }, this._submitting = !1, this._computeLabel = (t) => ({
      name: "Name",
      type: "Type",
      parent_id: "Parent Location",
      icon: "Location Icon (optional)"
    })[t.name] || t.name;
  }
  /**
   * Performance: Dialog is short-lived, minimal hass filtering needed
   */
  willUpdate(t) {
    var e, i, o;
    if (t.has("open")) {
      const n = t.get("open");
      if (console.log("[LocationDialog] willUpdate - open changed:", n, "->", this.open), console.log("[LocationDialog] Locations available:", this.locations.length, this.locations.map((a) => {
        var r, c;
        return `${a.name}(${(c = (r = a.modules) == null ? void 0 : r._meta) == null ? void 0 : c.type})`;
      })), this.open && !n) {
        if (console.log("[LocationDialog] Dialog opening, location:", this.location), this.location) {
          const a = ((e = this.location.modules) == null ? void 0 : e._meta) || {}, r = this.location.ha_area_id && ((i = this.hass) != null && i.areas) ? (o = this.hass.areas[this.location.ha_area_id]) == null ? void 0 : o.icon : void 0;
          this._config = {
            name: this.location.name,
            type: a.type || "area",
            parent_id: this.location.parent_id || void 0,
            // ADR: Icons are sourced from Home Assistant Area Registry (not stored in _meta.icon)
            icon: r || void 0
          };
        } else {
          const a = this.defaultType ?? "area", r = this.defaultParentId;
          this._config = {
            name: "",
            type: a,
            parent_id: r || void 0
          };
        }
        this._error = void 0;
      }
    }
  }
  updated(t) {
    super.updated(t), t.has("open") && this.open && this.updateComplete.then(() => {
      setTimeout(() => {
        var o, n;
        const e = (o = this.shadowRoot) == null ? void 0 : o.querySelector("ha-form");
        if (e != null && e.shadowRoot) {
          const a = e.shadowRoot.querySelector('input[type="text"]');
          if (a) {
            console.log("[LocationDialog] Focusing input:", a), a.focus(), a.select();
            return;
          }
        }
        const i = (n = this.shadowRoot) == null ? void 0 : n.querySelector('input[type="text"]');
        i && (console.log("[LocationDialog] Focusing fallback input:", i), i.focus(), i.select());
      }, 150);
    });
  }
  render() {
    console.log("[LocationDialog] render() called, open:", this.open);
    const t = this._getSchema();
    return console.log("[LocationDialog] Rendering dialog with schema:", t.length, "fields"), g`
      <ha-dialog
        .open=${this.open}
        data-testid="location-dialog"
        @closed=${this._handleClosed}
        .heading=${this.location ? "Edit Location" : "New Location"}
      >
        <div class="dialog-content">
          ${this._error ? g`
            <div class="error-message">${this._error}</div>
          ` : ""}

        <ha-form
            .hass=${this.hass}
            .data=${this._config}
            .schema=${t}
            .computeLabel=${this._computeLabel}
            @value-changed=${this._handleValueChanged}
          ></ha-form>
        </div>

        <ha-button
          slot="secondaryAction"
          .dialogAction=${"cancel"}
          @click=${this._handleCancel}
          ?disabled=${this._submitting}
        >
          Cancel
        </ha-button>
        <ha-button
          slot="primaryAction"
          .dialogAction=${"confirm"}
          @click=${this._handleSubmit}
          ?disabled=${!this._isValid() || this._submitting}
        >
          ${this._submitting ? "Saving..." : this.location ? "Save" : "Create"}
        </ha-button>
      </ha-dialog>
    `;
  }
  _getSchema() {
    console.log("[LocationDialog] _getSchema called, type:", this._config.type, "locations:", this.locations.length);
    const t = this._getValidParents(), e = this._includeRootOption(), i = e || t.length > 1;
    console.log("[LocationDialog] parentOptions:", t), this.location;
    const o = [
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
              { value: "area", label: "Area" },
              { value: "building", label: "Building" },
              { value: "grounds", label: "Grounds" },
              { value: "subarea", label: "Subarea" }
            ]
          }
        }
      }
    ];
    return i && o.push({
      name: "parent_id",
      selector: {
        select: {
          options: [
            ...e ? [{ value: "", label: "(Root Level)" }] : [],
            ...t
          ]
        }
      }
    }), o.push({
      name: "icon",
      selector: { icon: {} }
    }), o;
  }
  /**
   * Get valid parent locations based on hierarchy rules
   * See: docs/history/2026.02.24-ui-design.md Section 5.3.1
   *
   * IMPORTANT: These hierarchy rules are UI-layer validations only, NOT kernel constraints.
   * The kernel allows any Location to parent any other (only enforces no cycles).
   * The integration UI enforces these sensible rules to prevent user confusion:
   * - Floors can't nest (floor → floor blocked)
   * - Floors can be root-level or children of Building only
   * - Building/Grounds wrappers are root-level
   *
   * Power users can bypass these rules via direct API calls if needed.
   */
  _getValidParents() {
    const t = this._config.type, e = He(t);
    if (e.length === 1 && e[0] === "root")
      return [];
    const o = e.filter((a) => a !== "root");
    if (console.log("[LocationDialog] _getValidParents:", {
      currentType: t,
      allowedParentTypes: e,
      filteredTypes: o,
      totalLocations: this.locations.length
    }), o.length === 0) return [];
    const n = this.locations.filter((a) => {
      if (a.is_explicit_root || this._isManagedShadowLocation(a)) return !1;
      const r = B(a);
      return o.includes(r);
    }).map((a) => ({
      value: a.id,
      label: a.name
    }));
    return console.log("[LocationDialog] Valid parents:", n.length, n.map((a) => a.label)), n;
  }
  _isManagedShadowLocation(t) {
    var i;
    const e = ((i = t.modules) == null ? void 0 : i._meta) || {};
    return String(e.role || "").trim().toLowerCase() === "managed_shadow";
  }
  _includeRootOption() {
    return !1;
  }
  _submitParentId() {
    const t = He(this._config.type);
    if (t.length === 1 && t[0] === "root") return null;
    const i = String(this._config.parent_id || "").trim();
    if (i) return i;
    const o = this._getValidParents();
    return o.length === 1 ? String(o[0].value) : null;
  }
  _handleValueChanged(t) {
    console.log("[LocationDialog] value-changed received:", t.detail), this._config = { ...this._config, ...t.detail.value }, console.log("[LocationDialog] Updated config:", this._config), this._error = void 0, this.requestUpdate();
  }
  _isValid() {
    return !!this._config.name && !!this._config.type;
  }
  _formatSaveError(t) {
    const e = String((t == null ? void 0 : t.message) || t || "Failed to save location"), i = e.toLowerCase();
    return i.includes("location lifecycle mutations are disabled in this adapter") || i.includes("create/rename/delete floors and areas") ? "Legacy policy error detected. Restart Home Assistant and hard refresh the browser to load updated location create/update support." : e;
  }
  async _handleSubmit() {
    if (console.log("[LocationDialog] Submit clicked, config:", this._config), console.log("[LocationDialog] isValid:", this._isValid(), "submitting:", this._submitting), !this._isValid() || this._submitting) {
      console.log("[LocationDialog] Submit blocked - invalid or already submitting");
      return;
    }
    this._submitting = !0, this._error = void 0;
    try {
      this.location ? (await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/update",
          location_id: this.location.id,
          changes: {
            name: this._config.name,
            parent_id: this._submitParentId()
          }
        })
      ), await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/set_module_config",
          location_id: this.location.id,
          module_id: "_meta",
          config: {
            type: this._config.type
          }
        })
      )) : await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/create",
          name: this._config.name,
          parent_id: this._submitParentId(),
          meta: {
            type: this._config.type
          }
        })
      ), this.dispatchEvent(new CustomEvent("saved", {
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
    } catch (t) {
      console.error("Failed to save location:", t), this._error = this._formatSaveError(t);
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
      bubbles: !1,
      composed: !1
    }));
  }
  _withEntryId(t) {
    const e = typeof this.entryId == "string" ? this.entryId.trim() : "";
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
};
be.properties = {
  hass: { attribute: !1 },
  open: { type: Boolean },
  location: { attribute: !1 },
  locations: { attribute: !1 },
  entryId: { attribute: !1 },
  defaultParentId: { attribute: !1 },
  defaultType: { attribute: !1 },
  // Internal state - also needs explicit declaration for Vite
  _config: { state: !0 },
  _submitting: { state: !0 },
  _error: { state: !0 }
}, be.styles = [
  Se,
  Xt`
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
let Ze = be;
customElements.get("ht-location-dialog") || customElements.define("ht-location-dialog", Ze);
const Mi = "topomation:panel-tree-split", Ni = "topomation:panel-right-mode", ze = 0.4, Ue = 0.25, We = 0.75, Xn = "application/x-topomation-entity-id";
var Wi, Ki;
try {
  (Ki = (Wi = import.meta) == null ? void 0 : Wi.hot) == null || Ki.accept(() => window.location.reload());
} catch {
}
const we = class we extends ut {
  constructor() {
    super(), this.narrow = !1, this._locations = [], this._locationsVersion = 0, this._loading = !0, this._pendingChanges = /* @__PURE__ */ new Map(), this._saving = !1, this._discarding = !1, this._locationDialogOpen = !1, this._eventLogOpen = !1, this._eventLogScope = "subtree", this._eventLogEntries = [], this._occupancyStateByLocation = {}, this._occupancyTransitionByLocation = {}, this._adjacencyEdges = [], this._handoffTraceByLocation = {}, this._treePanelSplit = ze, this._isResizingPanels = !1, this._entityAreaById = {}, this._entitySearch = "", this._assignBusyByEntityId = {}, this._rightPanelMode = "inspector", this._assignmentFilter = "all", this._deviceGroupExpanded = {}, this._haRegistryRevision = 0, this._hasLoaded = !1, this._loadSeq = 0, this._entityAreaIndexLoaded = !1, this._entityAreaRevision = 0, this._deviceGroupsCache = [], this._opQueueByLocationId = /* @__PURE__ */ new Map(), this._handleDeviceSearch = (t) => {
      var i;
      const e = ((i = t.target) == null ? void 0 : i.value) ?? "";
      this._entitySearch = e;
    }, this._handleEntityDropped = (t) => {
      var o, n;
      t.stopPropagation();
      const e = (o = t.detail) == null ? void 0 : o.entityId, i = (n = t.detail) == null ? void 0 : n.targetLocationId;
      !e || !i || this._assignEntityToLocation(e, i);
    }, this._handleNewLocation = (t) => {
      t && (t.preventDefault(), t.stopPropagation()), this._editingLocation = void 0, this._newLocationDefaults = {
        parentId: null,
        type: "building"
      }, this._locationDialogOpen = !0;
    }, this._handleDeleteSelected = (t) => {
      t && (t.preventDefault(), t.stopPropagation());
      const e = this._getSelectedLocation();
      if (!e) {
        this._showToast("Select a location to delete", "warning");
        return;
      }
      if (!this._canDeleteLocation(e)) {
        this._showToast(this._deleteDisabledReason(e), "warning");
        return;
      }
      confirm(`Delete "${e.name}"?`) && this._handleLocationDelete(
        new CustomEvent("location-delete", {
          detail: { location: e }
        })
      );
    }, this._handleKeyDown = (t) => {
      (t.ctrlKey || t.metaKey) && t.key === "s" && (t.preventDefault(), this._pendingChanges.size > 0 && !this._saving && this._handleSaveChanges()), (t.ctrlKey || t.metaKey) && t.key === "z" && !t.shiftKey && t.preventDefault(), (t.ctrlKey || t.metaKey) && (t.key === "y" || t.key === "z" && t.shiftKey) && t.preventDefault(), t.key === "Escape" && this._pendingChanges.size > 0 && !this._saving && confirm("Discard all pending changes?") && this._handleDiscardChanges(), t.key === "?" && !t.ctrlKey && !t.metaKey && this._showKeyboardShortcutsHelp();
    }, this._handleOpenSidebar = () => {
      this.dispatchEvent(
        new CustomEvent("hass-toggle-menu", {
          bubbles: !0,
          composed: !0,
          detail: { open: !0 }
        })
      );
    }, this._handlePanelSplitterPointerDown = (t) => {
      this._isSplitStackedLayout() || (t.preventDefault(), this._panelResizePointerId = t.pointerId, this._isResizingPanels = !0, this._applyPanelSplitFromClientX(t.clientX), window.addEventListener("pointermove", this._handlePanelSplitterPointerMove), window.addEventListener("pointerup", this._handlePanelSplitterPointerUp), window.addEventListener("pointercancel", this._handlePanelSplitterPointerUp));
    }, this._handlePanelSplitterPointerMove = (t) => {
      this._isResizingPanels && (this._panelResizePointerId !== void 0 && t.pointerId !== this._panelResizePointerId || this._applyPanelSplitFromClientX(t.clientX));
    }, this._handlePanelSplitterPointerUp = (t) => {
      this._isResizingPanels && (this._panelResizePointerId !== void 0 && t.pointerId !== this._panelResizePointerId || (this._applyPanelSplitFromClientX(t.clientX, !0), this._stopPanelSplitterDrag()));
    }, this._handlePanelSplitterKeyDown = (t) => {
      if (this._isSplitStackedLayout()) return;
      const e = t.shiftKey ? 0.08 : 0.03;
      if (t.key === "ArrowLeft") {
        t.preventDefault(), this._setPanelSplit(this._treePanelSplit - e, !0);
        return;
      }
      if (t.key === "ArrowRight") {
        t.preventDefault(), this._setPanelSplit(this._treePanelSplit + e, !0);
        return;
      }
      if (t.key === "Home") {
        t.preventDefault(), this._setPanelSplit(Ue, !0);
        return;
      }
      t.key === "End" && (t.preventDefault(), this._setPanelSplit(We, !0));
    }, this._handlePanelSplitterReset = () => {
      this._setPanelSplit(ze, !0);
    }, this._toggleEventLog = () => {
      this._eventLogOpen = !this._eventLogOpen, this._syncStateChangedSubscription();
    }, this._clearEventLog = () => {
      this._eventLogEntries = [];
    }, this._handleSourceTest = (t) => {
      this._logEvent("ui", "source test", t.detail);
    }, this._toggleEventLogScope = () => {
      this._eventLogScope = this._eventLogScope === "subtree" ? "all" : "subtree", this._logEvent(
        "ui",
        `event log scope set to ${this._eventLogScope === "subtree" ? "selected subtree" : "all locations"}`
      );
    };
  }
  _enqueueLocationOp(t, e) {
    const o = (this._opQueueByLocationId.get(t) ?? Promise.resolve()).catch(() => {
    }).then(e);
    return this._opQueueByLocationId.set(t, o), o;
  }
  _scheduleReload(t = !0) {
    this._reloadTimer && (window.clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._reloadTimer = window.setTimeout(() => {
      this._reloadTimer = void 0, this._loadLocations(t);
    }, 150);
  }
  willUpdate(t) {
    super.willUpdate(t), !this._hasLoaded && this.hass && (this._hasLoaded = !0, this._loadLocations()), t.has("hass") && this.hass && this._subscribeToUpdates();
  }
  connectedCallback() {
    super.connectedCallback(), this._restorePanelSplitPreference(), this._restoreRightPanelModePreference(), this._scheduleInitialLoad(), this._handleKeyDown = this._handleKeyDown.bind(this), document.addEventListener("keydown", this._handleKeyDown);
  }
  updated(t) {
    super.updated(t);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), document.removeEventListener("keydown", this._handleKeyDown), this._stopPanelSplitterDrag(), this._pendingLoadTimer && (clearTimeout(this._pendingLoadTimer), this._pendingLoadTimer = void 0), this._reloadTimer && (clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._registryRefreshTimer && (clearTimeout(this._registryRefreshTimer), this._registryRefreshTimer = void 0), this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubHandoffTrace && (this._unsubHandoffTrace(), this._unsubHandoffTrace = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0), this._unsubEntityRegistryUpdated && (this._unsubEntityRegistryUpdated(), this._unsubEntityRegistryUpdated = void 0), this._unsubDeviceRegistryUpdated && (this._unsubDeviceRegistryUpdated(), this._unsubDeviceRegistryUpdated = void 0), this._unsubAreaRegistryUpdated && (this._unsubAreaRegistryUpdated(), this._unsubAreaRegistryUpdated = void 0);
  }
  /**
   * CRITICAL PERFORMANCE: Filter hass updates to prevent unnecessary re-renders.
   * Without this, component re-renders on EVERY state change in HA (100+ times/min).
   * See: docs/history/2026.02.24-frontend-patterns.md Section 1.1
   */
  shouldUpdate(t) {
    for (const e of t.keys())
      if (e !== "hass") return !0;
    if (t.has("hass")) {
      const e = t.get("hass");
      return !e || e.areas !== this.hass.areas;
    }
    return !0;
  }
  render() {
    if (this._loading && !this._locations.length)
      return g`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    if (this._error)
      return g`
        <div class="error-container">
          <h3>Error Loading Topomation</h3>
          <p>${this._error}</p>
          <button class="button button-primary" @click=${this._loadLocations}>
            Retry
          </button>
        </div>
      `;
    const t = this._locations.find(
      (c) => c.id === this._selectedId
    ), e = this._managerView(), i = this._managerHeader(e), o = e === "location" ? void 0 : e, n = "Automation", a = this._deleteDisabledReason(t), r = `${(this._treePanelSplit * 100).toFixed(1)}%`;
    return g`
      <div class="panel-container" style=${`--tree-panel-basis: ${r};`}>
        <div class="panel-left">
          ${this._renderConflictBanner()}
          ${this._locations.length === 0 ? this._renderEmptyStateBanner() : ""}
          <div class="header">
            <div class="header-title">${i.title}</div>
            <div class="header-subtitle">
              ${i.subtitle}
            </div>
            <div class="header-actions">
              ${this._isSplitStackedLayout() ? g`
                    <button
                      class="button button-secondary"
                      @click=${this._handleOpenSidebar}
                      aria-label="Open Home Assistant sidebar"
                    >
                      Sidebar
                    </button>
                  ` : ""}
              ${g`
                    <button class="button button-primary" @click=${this._handleNewLocation}>
                      + Add Structure
                    </button>
                  `}
              <button
                class="button button-secondary"
                @click=${this._handleDeleteSelected}
                title=${a}
              >
                Delete Selected
              </button>
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
            .occupancyStates=${this._occupancyStateByLocation}
            .readOnly=${!1}
            .allowMove=${!0}
            .allowRename=${!0}
            @location-selected=${this._handleLocationSelected}
            @location-create=${this._handleLocationCreate}
            @location-edit=${this._handleLocationEdit}
            @location-moved=${this._handleLocationMoved}
            @location-lock-toggle=${this._handleLocationLockToggle}
            @location-occupancy-toggle=${this._handleLocationOccupancyToggle}
            @location-renamed=${this._handleLocationRenamed}
            @location-delete=${this._handleLocationDelete}
            @entity-dropped=${this._handleEntityDropped}
          ></ht-location-tree>
        </div>

        <div
          class="panel-splitter ${this._isResizingPanels ? "dragging" : ""}"
          role="separator"
          aria-label="Resize tree and configuration panels"
          aria-orientation="vertical"
          aria-valuemin=${Math.round(Ue * 100)}
          aria-valuemax=${Math.round(We * 100)}
          aria-valuenow=${Math.round(this._treePanelSplit * 100)}
          tabindex="0"
          title="Drag to resize panes. Double-click to reset."
          @pointerdown=${this._handlePanelSplitterPointerDown}
          @keydown=${this._handlePanelSplitterKeyDown}
          @dblclick=${this._handlePanelSplitterReset}
        ></div>

        <div class="panel-right">
          <div class="header">
            <div class="header-title">${n}</div>
            <div class="right-panel-modes" role="tablist" aria-label="Right panel mode">
              <button
                class="button ${this._rightPanelMode === "inspector" ? "button-primary" : "button-secondary"}"
                role="tab"
                aria-selected=${this._rightPanelMode === "inspector"}
                data-testid="right-mode-configure"
                @click=${() => this._handleRightPanelModeChange("inspector")}
              >
                Configure
              </button>
              <button
                class="button ${this._rightPanelMode === "assign" ? "button-primary" : "button-secondary"}"
                role="tab"
                aria-selected=${this._rightPanelMode === "assign"}
                data-testid="right-mode-assign"
                @click=${() => this._handleRightPanelModeChange("assign")}
              >
                Assign Devices
              </button>
            </div>
          </div>
          ${this._rightPanelMode === "assign" ? this._renderDeviceAssignmentPanel(t) : g`
                <ht-location-inspector
                  .hass=${this.hass}
                  .location=${t}
                  .allLocations=${this._locations}
                  .adjacencyEdges=${this._adjacencyEdges}
                  .entryId=${this._activeEntryId()}
                  .entityRegistryRevision=${this._haRegistryRevision}
                  .forcedTab=${o}
                  .occupancyStates=${this._occupancyStateByLocation}
                  .occupancyTransitions=${this._occupancyTransitionByLocation}
                  .handoffTraces=${t ? this._handoffTraceByLocation[t.id] || [] : []}
                  @source-test=${this._handleSourceTest}
                  @adjacency-changed=${this._handleAdjacencyChanged}
                  @location-meta-changed=${this._handleLocationMetaChanged}
                ></ht-location-inspector>
              `}
          ${this._eventLogOpen ? this._renderEventLog() : ""}
        </div>
      </div>

      ${this._renderDialogs()}
    `;
  }
  _managerViewFromPath(t) {
    return t.startsWith("/topomation-occupancy") ? "occupancy" : t.startsWith("/topomation-actions") ? "actions" : "location";
  }
  _managerView() {
    var e, i, o;
    const t = (i = (e = this.panel) == null ? void 0 : e.config) == null ? void 0 : i.topomation_view;
    return t === "location" || t === "occupancy" || t === "actions" ? t : (o = this.route) != null && o.path ? this._managerViewFromPath(this.route.path) : this._managerViewFromPath(window.location.pathname || "");
  }
  _managerHeader(t) {
    return {
      title: "Topology",
      subtitle: "Organize buildings, grounds, floors, areas, and subareas, then select a location to configure automation."
    };
  }
  _renderDialogs() {
    var t, e;
    return g`
      <ht-location-dialog
        .hass=${this.hass}
        .open=${this._locationDialogOpen}
        .location=${this._editingLocation}
        .locations=${this._parentSelectableLocations()}
        .entryId=${this._activeEntryId()}
        .defaultParentId=${(t = this._newLocationDefaults) == null ? void 0 : t.parentId}
        .defaultType=${(e = this._newLocationDefaults) == null ? void 0 : e.type}
        @dialog-closed=${() => {
      this._locationDialogOpen = !1, this._editingLocation = void 0, this._newLocationDefaults = void 0;
    }}
        @saved=${this._handleLocationDialogSaved}
      ></ht-location-dialog>
    `;
  }
  async _ensureEntityAreaIndex(t = !1) {
    var e;
    if ((e = this.hass) != null && e.callWS && !(!t && this._entityAreaIndexLoaded)) {
      if (this._entityAreaIndexPromise) {
        await this._entityAreaIndexPromise;
        return;
      }
      this._entityAreaIndexPromise = (async () => {
        try {
          const [i, o] = await Promise.all([
            this.hass.callWS({ type: "config/entity_registry/list" }),
            this.hass.callWS({ type: "config/device_registry/list" })
          ]), n = /* @__PURE__ */ new Map();
          if (Array.isArray(o))
            for (const d of o) {
              const p = typeof (d == null ? void 0 : d.id) == "string" ? d.id : void 0, f = typeof (d == null ? void 0 : d.area_id) == "string" ? d.area_id : void 0;
              p && f && n.set(p, f);
            }
          const a = {};
          if (Array.isArray(i))
            for (const d of i) {
              const p = typeof (d == null ? void 0 : d.entity_id) == "string" ? d.entity_id : void 0;
              if (!p) continue;
              const f = typeof (d == null ? void 0 : d.area_id) == "string" ? d.area_id : void 0, u = typeof (d == null ? void 0 : d.device_id) == "string" ? n.get(d.device_id) : void 0;
              a[p] = f || u || null;
            }
          const r = this._entityAreaById, c = Object.keys(r), l = Object.keys(a);
          (c.length !== l.length || l.some((d) => r[d] !== a[d])) && (this._entityAreaById = a, this._entityAreaRevision += 1), this._entityAreaIndexLoaded = !0;
        } catch {
        }
      })();
      try {
        await this._entityAreaIndexPromise;
      } finally {
        this._entityAreaIndexPromise = void 0;
      }
    }
  }
  _renderDeviceAssignmentPanel(t) {
    const e = !this._entityAreaIndexLoaded && !!this._entityAreaIndexPromise, i = this._buildDeviceGroups(), o = this._prioritizeDeviceGroupsForSelection(
      this._visibleDeviceGroups(i),
      t == null ? void 0 : t.id
    ), n = this._assignmentFilterStats(i), a = t ? t.name : "Select a location";
    return g`
      <div class="device-assignment-panel">
        <div class="device-panel-head">
          <div class="device-panel-title">Device Assignment</div>
          <div class="device-panel-subtitle">
            Assign target: <strong>${a}</strong>
          </div>
          <input
            class="device-search"
            type="search"
            .value=${this._entitySearch}
            placeholder="Search devices..."
            @input=${this._handleDeviceSearch}
          />
          <div class="device-toolbar">
            <div class="device-filter-group">
              <button
                class="button ${this._assignmentFilter === "all" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("all")}
              >
                All (${n.all})
              </button>
              <button
                class="button ${this._assignmentFilter === "unassigned" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("unassigned")}
              >
                Unassigned (${n.unassigned})
              </button>
              <button
                class="button ${this._assignmentFilter === "assigned" ? "button-primary" : "button-secondary"} device-filter-chip"
                @click=${() => this._handleAssignmentFilterChange("assigned")}
              >
                Assigned (${n.assigned})
              </button>
            </div>
            <div class="device-group-actions">
              <button class="button button-secondary device-filter-chip" @click=${() => this._setAllDeviceGroups(!0, o)}>
                Expand all
              </button>
              <button class="button button-secondary device-filter-chip" @click=${() => this._setAllDeviceGroups(!1, o)}>
                Collapse all
              </button>
            </div>
          </div>
        </div>
        ${e ? g`<div class="device-empty">Loading area mapping…</div>` : ""}

        ${o.length === 0 ? g`<div class="device-empty">No devices match the current filter.</div>` : o.map((r) => this._renderDeviceGroup(r, t == null ? void 0 : t.id))}
      </div>
    `;
  }
  _renderDeviceGroup(t, e) {
    const i = this._isGroupExpanded(t.key);
    return g`
      <section class="device-group" data-testid=${`device-group-${t.key}`}>
        <button
          class="device-group-header"
          @click=${() => this._toggleDeviceGroup(t.key)}
          aria-expanded=${i}
          aria-label=${`Toggle ${t.label} devices`}
        >
          <span class="device-group-header-left">
            <span class="device-group-chevron">${i ? "▾" : "▸"}</span>
            <span class="device-group-label">${t.label}</span>
          </span>
          <span class="device-group-count">${t.entities.length}</span>
        </button>
        ${i ? t.entities.length === 0 ? g`<div class="device-empty">No devices in this group.</div>` : t.entities.map((o) => {
      const n = !!this._assignBusyByEntityId[o], a = this._entityDisplayName(o);
      return g`
                <div
                  class="device-row"
                  draggable="true"
                  data-entity-id=${o}
                  @dragstart=${(r) => this._handleDeviceDragStart(r, o)}
                >
                  <div>
                    <div class="device-name">${a}</div>
                    <div class="device-meta">${this._deviceMetaForGroup(o, t)}</div>
                  </div>
                  <button
                    class="button button-secondary device-assign-btn"
                    ?disabled=${!e || n}
                    @click=${() => this._handleAssignButton(o, e)}
                  >
                    ${n ? "Assigning..." : "Assign"}
                  </button>
                </div>
              `;
    }) : ""}
      </section>
    `;
  }
  _handleAssignmentFilterChange(t) {
    this._assignmentFilter = t;
  }
  _assignmentFilterStats(t) {
    const e = t.filter((o) => o.type === "unassigned").reduce((o, n) => o + n.entities.length, 0), i = t.filter((o) => o.type !== "unassigned").reduce((o, n) => o + n.entities.length, 0);
    return { all: e + i, unassigned: e, assigned: i };
  }
  _visibleDeviceGroups(t) {
    return this._assignmentFilter === "all" ? t : this._assignmentFilter === "unassigned" ? t.filter((e) => e.type === "unassigned") : t.filter((e) => e.type !== "unassigned");
  }
  _prioritizeDeviceGroupsForSelection(t, e) {
    if (!e || t.length <= 1) return t;
    const i = t.findIndex((n) => n.locationId === e);
    return i <= 0 ? t : [t[i], ...t.slice(0, i), ...t.slice(i + 1)];
  }
  _isGroupExpanded(t) {
    const e = this._deviceGroupExpanded[t];
    return typeof e == "boolean" ? e : t === "unassigned";
  }
  _toggleDeviceGroup(t) {
    const e = this._isGroupExpanded(t);
    this._deviceGroupExpanded = {
      ...this._deviceGroupExpanded,
      [t]: !e
    };
  }
  _setAllDeviceGroups(t, e) {
    const i = { ...this._deviceGroupExpanded };
    for (const o of e)
      i[o.key] = t;
    this._deviceGroupExpanded = i;
  }
  _deviceMetaForGroup(t, e) {
    if (e.type !== "unassigned")
      return t;
    const i = this._areaLabel(this._effectiveAreaIdForEntity(t));
    return i === "Unassigned" ? t : `${t} · HA Area: ${i}`;
  }
  _handleDeviceDragStart(t, e) {
    var i, o;
    (i = t.dataTransfer) == null || i.setData(Xn, e), (o = t.dataTransfer) == null || o.setData("text/plain", e), t.dataTransfer && (t.dataTransfer.effectAllowed = "move");
  }
  _handleAssignButton(t, e) {
    if (!e) {
      this._showToast("Select a location first", "warning");
      return;
    }
    this._assignEntityToLocation(t, e);
  }
  _allKnownEntityIds() {
    var e;
    const t = /* @__PURE__ */ new Set();
    for (const i of Object.keys(((e = this.hass) == null ? void 0 : e.states) || {})) t.add(i);
    for (const i of Object.keys(this._entityAreaById)) t.add(i);
    for (const i of this._locations)
      for (const o of i.entity_ids || [])
        t.add(o);
    return [...t];
  }
  _entityDisplayName(t) {
    var o, n, a;
    const e = (n = (o = this.hass) == null ? void 0 : o.states) == null ? void 0 : n[t], i = (a = e == null ? void 0 : e.attributes) == null ? void 0 : a.friendly_name;
    return typeof i == "string" && i.trim() ? i : t;
  }
  _effectiveAreaIdForEntity(t) {
    var i, o, n;
    if (Object.prototype.hasOwnProperty.call(this._entityAreaById, t))
      return this._entityAreaById[t];
    const e = ((n = (o = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : o[t]) == null ? void 0 : n.attributes) || {};
    return typeof e.area_id == "string" ? e.area_id : null;
  }
  _areaLabel(t) {
    var e, i, o;
    return t ? ((o = (i = (e = this.hass) == null ? void 0 : e.areas) == null ? void 0 : i[t]) == null ? void 0 : o.name) || t : "Unassigned";
  }
  _isAssignableEntity(t) {
    var i, o, n;
    const e = ((n = (o = (i = this.hass) == null ? void 0 : i.states) == null ? void 0 : o[t]) == null ? void 0 : n.attributes) || {};
    return !((e == null ? void 0 : e.device_class) === "occupancy" && (e != null && e.location_id));
  }
  _groupTypeForLocation(t) {
    const e = B(t);
    return e === "area" ? "area" : e === "subarea" ? "subarea" : e === "floor" ? "floor" : e === "building" ? "building" : e === "grounds" ? "grounds" : "other";
  }
  _buildDeviceGroups() {
    var h;
    const t = this._entitySearch.trim().toLowerCase(), e = Object.keys(((h = this.hass) == null ? void 0 : h.states) || {}).length, i = `${t}|${e}|${this._locationsVersion}|${this._entityAreaRevision}`;
    if (this._deviceGroupsCacheKey === i)
      return this._deviceGroupsCache;
    const o = new Map(this._locations.map((d) => [d.id, d])), n = /* @__PURE__ */ new Map();
    for (const d of this._locations)
      for (const p of d.entity_ids || [])
        p && !n.has(p) && n.set(p, d.id);
    const a = /* @__PURE__ */ new Map(), r = (d, p, f, u) => {
      const _ = a.get(d);
      if (_) return _;
      const v = { key: d, label: p, type: f, locationId: u, entities: [] };
      return a.set(d, v), v;
    };
    r("unassigned", "Unassigned", "unassigned");
    for (const d of this._allKnownEntityIds()) {
      if (!this._isAssignableEntity(d)) continue;
      const p = this._entityDisplayName(d), f = n.get(d), u = f ? o.get(f) : void 0, _ = this._areaLabel(this._effectiveAreaIdForEntity(d));
      if (t && !`${p} ${d} ${(u == null ? void 0 : u.name) || ""} ${_}`.toLowerCase().includes(t))
        continue;
      if (!u) {
        r("unassigned", "Unassigned", "unassigned").entities.push(d);
        continue;
      }
      const v = this._groupTypeForLocation(u);
      r(
        u.id,
        u.name,
        v,
        u.id
      ).entities.push(d);
    }
    for (const d of a.values())
      d.entities.sort(
        (p, f) => this._entityDisplayName(p).localeCompare(this._entityDisplayName(f))
      );
    const c = {
      unassigned: 0,
      area: 1,
      subarea: 2,
      floor: 3,
      building: 4,
      grounds: 5,
      other: 6
    }, l = [...a.values()].filter((d) => d.entities.length > 0 || d.key === "unassigned").sort((d, p) => {
      const f = c[d.type] - c[p.type];
      return f !== 0 ? f : d.label.localeCompare(p.label);
    });
    return this._deviceGroupsCacheKey = i, this._deviceGroupsCache = l, l;
  }
  _applyEntityAssignmentLocally(t, e) {
    const i = this._locations.map((n) => ({
      ...n,
      entity_ids: (n.entity_ids || []).filter((a) => a !== t)
    })), o = i.find((n) => n.id === e);
    o && !o.entity_ids.includes(t) && (o.entity_ids = [...o.entity_ids, t]), this._locations = i, this._locationsVersion += 1, o && (this._deviceGroupExpanded = {
      ...this._deviceGroupExpanded,
      [o.id]: !0
    }), o != null && o.ha_area_id && (this._entityAreaById = { ...this._entityAreaById, [t]: o.ha_area_id }, this._entityAreaRevision += 1);
  }
  async _assignEntityToLocation(t, e) {
    if (!t || !e || this._assignBusyByEntityId[t]) return;
    if (!this._locations.find((n) => n.id === e)) {
      this._showToast("Target location not found", "error");
      return;
    }
    const o = this._locations.map((n) => ({
      ...n,
      entity_ids: [...n.entity_ids || []]
    }));
    this._assignBusyByEntityId = { ...this._assignBusyByEntityId, [t]: !0 }, this._applyEntityAssignmentLocally(t, e);
    try {
      await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/assign_entity",
          entity_id: t,
          target_location_id: e
        })
      ), await this._loadLocations(!0);
    } catch (n) {
      this._locations = o, this._locationsVersion += 1, console.error("Failed to assign entity:", n), this._showToast((n == null ? void 0 : n.message) || "Failed to assign device", "error");
    } finally {
      const { [t]: n, ...a } = this._assignBusyByEntityId;
      this._assignBusyByEntityId = a;
    }
  }
  async _loadLocations(t = !1) {
    const e = ++this._loadSeq, i = t || this._locations.length > 0;
    this._loading = !i, this._error = void 0;
    try {
      if (!this.hass)
        throw new Error("Home Assistant connection not ready");
      const n = await Promise.race([
        this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/list"
          })
        ),
        new Promise(
          (l, h) => setTimeout(() => h(new Error("Timeout loading locations")), 8e3)
        )
      ]);
      if (!n || !n.locations)
        throw new Error("Invalid response format: missing locations array");
      if (e !== this._loadSeq)
        return;
      const a = /* @__PURE__ */ new Map();
      for (const l of n.locations) a.set(l.id, l);
      const c = Array.from(a.values()).filter((l) => !l.is_explicit_root);
      this._locations = [...c], this._adjacencyEdges = Array.isArray(n.adjacency_edges) ? [...n.adjacency_edges] : [], this._occupancyStateByLocation = this._buildOccupancyStateMapFromStates(), this._occupancyTransitionByLocation = this._buildOccupancyTransitionsFromStates(), this._locationsVersion += 1, this._logEvent("ws", "locations/list loaded", {
        count: this._locations.length
      }), (!this._selectedId || !this._locations.some((l) => l.id === this._selectedId) || this._isManagedShadowLocation(this._locations.find((l) => l.id === this._selectedId))) && (this._selectedId = this._preferredSelectedLocationId()), this._rightPanelMode === "assign" && this._ensureEntityAreaIndex();
    } catch (o) {
      console.error("Failed to load locations:", o), this._error = o.message || "Failed to load locations", this._logEvent("error", "locations/list failed", (o == null ? void 0 : o.message) || o);
    } finally {
      this._loading = !1;
    }
  }
  _scheduleInitialLoad() {
    if (!this._hasLoaded) {
      if (this.hass) {
        this._hasLoaded = !0, this._loadLocations();
        return;
      }
      this._pendingLoadTimer = window.setTimeout(() => this._scheduleInitialLoad(), 300);
    }
  }
  _handleLocationSelected(t) {
    this._selectedId = t.detail.locationId;
  }
  _handleAdjacencyChanged() {
    this._loadLocations(!0);
  }
  _handleLocationMetaChanged() {
    this._loadLocations(!0);
  }
  /**
   * Render rename conflict notification banner
   */
  _renderEmptyStateBanner() {
    var i;
    const t = (i = this.hass) == null ? void 0 : i.navigate;
    return g`
      <div class="empty-state-banner">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <div class="empty-state-banner-content">
          <strong>Get started</strong>: Create your first location structure here.
          You can add floors, areas, buildings, grounds, and subareas, then manage hierarchy and occupancy.
        </div>
        <a href="/config/areas" class="button button-primary" @click=${(o) => {
      o.preventDefault(), typeof t == "function" ? t("/config/areas") : window.location.href = "/config/areas";
    }}>
          Open HA Areas/Floors
        </a>
      </div>
    `;
  }
  _renderConflictBanner() {
    if (!this._renameConflict)
      return "";
    const { locationId: t, localName: e, haName: i } = this._renameConflict, o = this._locations.find((n) => n.id === t);
    return g`
      <div class="conflict-banner">
        <div class="conflict-content">
          <div class="conflict-title">⚠️ Rename Conflict Detected</div>
          <div class="conflict-message">
            Location "${(o == null ? void 0 : o.name) || t}" was renamed in Home Assistant to "${i}".
            Your local name is "${e}". Which name should we keep?
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
    this._renameConflict && (this._renameConflict = void 0);
  }
  _handleConflictAcceptHA() {
    if (!this._renameConflict) return;
    const { locationId: t, haName: e } = this._renameConflict, i = this._locations.find((o) => o.id === t);
    i && (i.name = e, this._locations = [...this._locations]), this._renameConflict = void 0;
  }
  _handleConflictDismiss() {
    this._renameConflict = void 0;
  }
  _handleLocationCreate() {
    this._handleNewLocation();
  }
  _canDeleteLocation(t) {
    return !(!t || t.is_explicit_root);
  }
  _deleteDisabledReason(t) {
    return t ? t.is_explicit_root ? "Home root cannot be deleted" : "Delete selected location" : "Select a location to delete";
  }
  _handleLocationEdit(t) {
    var o;
    t.stopPropagation();
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = e ? this._locations.find((n) => n.id === e) : this._getSelectedLocation();
    if (!i) {
      this._showToast("Select a location to edit", "warning");
      return;
    }
    this._editingLocation = i, this._newLocationDefaults = void 0, this._locationDialogOpen = !0;
  }
  async _handleLocationMoved(t) {
    t.stopPropagation();
    const { locationId: e, newParentId: i, newIndex: o } = t.detail || {};
    if (!e || typeof o != "number") {
      this._showToast("Invalid move request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/reorder",
            location_id: e,
            new_parent_id: i ?? null,
            new_index: o
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1;
      } catch (n) {
        console.error("Failed to move location:", n), this._showToast((n == null ? void 0 : n.message) || "Failed to move location", "error");
      }
    });
  }
  async _handleLocationLockToggle(t) {
    var o, n;
    t.stopPropagation();
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = !!((n = t == null ? void 0 : t.detail) != null && n.lock);
    if (!e) {
      this._showToast("Invalid lock request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      var a;
      try {
        const r = i ? "lock" : "unlock";
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: r,
          service_data: this._serviceDataWithEntryId({
            location_id: e,
            source_id: "manual_ui"
          })
        }), this._logEvent("ui", r, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1;
        const c = ((a = this._locations.find((l) => l.id === e)) == null ? void 0 : a.name) || e;
        this._showToast(`${i ? "Locked" : "Unlocked"} "${c}"`, "success");
      } catch (r) {
        console.error("Failed to toggle lock:", r), this._showToast((r == null ? void 0 : r.message) || "Failed to update lock", "error");
      }
    });
  }
  _getLocationLockState(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const o of Object.values(e)) {
      const n = (o == null ? void 0 : o.attributes) || {};
      if ((n == null ? void 0 : n.device_class) !== "occupancy" || String(n == null ? void 0 : n.location_id) !== String(t)) continue;
      const a = Array.isArray(n == null ? void 0 : n.locked_by) ? n.locked_by.map((r) => String(r)) : [];
      return {
        isLocked: !!(n != null && n.is_locked),
        lockedBy: a
      };
    }
    return { isLocked: !1, lockedBy: [] };
  }
  async _handleLocationOccupancyToggle(t) {
    var o, n;
    t.stopPropagation();
    const e = (o = t == null ? void 0 : t.detail) == null ? void 0 : o.locationId, i = !!((n = t == null ? void 0 : t.detail) != null && n.occupied);
    if (!e) {
      this._showToast("Invalid occupancy request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      var h, d;
      const a = this._locations.find((p) => p.id === e), r = (a == null ? void 0 : a.name) || e, { isLocked: c, lockedBy: l } = this._getLocationLockState(e);
      if (c) {
        const p = l.length ? ` (${l.join(", ")})` : "";
        this._showToast(`Hey, can't do it. "${r}" is locked${p}.`, "warning");
        return;
      }
      try {
        if (!a) {
          this._showToast("Invalid occupancy request", "error");
          return;
        }
        const p = i ? "trigger" : "vacate_area", f = {
          location_id: e,
          source_id: "manual_ui"
        };
        if (i) {
          const u = (d = (h = a.modules) == null ? void 0 : h.occupancy) == null ? void 0 : d.default_timeout;
          typeof u == "number" && u >= 0 && (f.timeout = Math.floor(u));
        } else
          f.include_locked = !1;
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: p,
          service_data: this._serviceDataWithEntryId(f)
        }), this._logEvent("ui", p, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(
          i ? `Marked "${r}" as occupied` : `Marked "${r}" as unoccupied (vacated)`,
          "success"
        );
      } catch (p) {
        console.error("Failed to toggle occupancy:", p), this._showToast((p == null ? void 0 : p.message) || "Hey, can't do it.", "error");
      }
    });
  }
  async _handleLocationRenamed(t) {
    t.stopPropagation();
    const { locationId: e, newName: i } = t.detail || {};
    if (!e || !i) {
      this._showToast("Invalid rename request", "error");
      return;
    }
    await this._enqueueLocationOp(e, async () => {
      try {
        await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/update",
            location_id: e,
            changes: { name: String(i) }
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(`Renamed to "${i}"`, "success");
      } catch (o) {
        console.error("Failed to rename location:", o), this._showToast((o == null ? void 0 : o.message) || "Failed to rename location", "error");
      }
    });
  }
  async _handleLocationDelete(t) {
    var i;
    t.stopPropagation();
    const e = (i = t == null ? void 0 : t.detail) == null ? void 0 : i.location;
    if (!(e != null && e.id)) {
      this._showToast("Invalid delete request", "error");
      return;
    }
    if (e.is_explicit_root) {
      this._showToast("Home root cannot be deleted", "warning");
      return;
    }
    await this._enqueueLocationOp(e.id, async () => {
      var o;
      try {
        const n = this._selectedId === e.id, a = e.parent_id ?? void 0;
        if (await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/delete",
            location_id: e.id
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1, n) {
          const r = (a && this._locations.some((c) => c.id === a) ? a : (o = this._locations[0]) == null ? void 0 : o.id) ?? void 0;
          this._selectedId = r;
        }
        this._showToast(`Deleted "${e.name}"`, "success");
      } catch (n) {
        console.error("Failed to delete location:", n), this._showToast((n == null ? void 0 : n.message) || "Failed to delete location", "error");
      }
    });
  }
  async _handleLocationDialogSaved(t) {
    const e = t.detail, i = !!this._editingLocation;
    try {
      await this._loadLocations(!0), this._locationsVersion += 1, this._locationDialogOpen = !1, this._editingLocation = void 0, this._showToast(
        i ? `Updated "${e.name}"` : `Created "${e.name}"`,
        "success"
      );
    } catch (o) {
      console.error("Failed to reload locations:", o), this._showToast(`Failed to reload: ${o.message}`, "error");
    }
  }
  _isSplitStackedLayout() {
    return this.narrow ? !0 : typeof window.matchMedia != "function" ? !1 : window.matchMedia("(max-width: 768px)").matches;
  }
  _clampPanelSplit(t) {
    return Number.isFinite(t) ? Math.min(We, Math.max(Ue, t)) : ze;
  }
  _setPanelSplit(t, e = !1) {
    const i = this._clampPanelSplit(t);
    Math.abs(i - this._treePanelSplit) < 1e-3 || (this._treePanelSplit = i, e && this._persistPanelSplitPreference());
  }
  _restorePanelSplitPreference() {
    var t;
    try {
      const e = (t = window.localStorage) == null ? void 0 : t.getItem(Mi);
      if (!e) return;
      const i = Number(e);
      this._setPanelSplit(i);
    } catch {
    }
  }
  _persistPanelSplitPreference() {
    var t;
    try {
      (t = window.localStorage) == null || t.setItem(Mi, this._treePanelSplit.toFixed(4));
    } catch {
    }
  }
  _restoreRightPanelModePreference() {
    var t;
    try {
      const e = (t = window.localStorage) == null ? void 0 : t.getItem(Ni);
      (e === "assign" || e === "inspector") && (this._rightPanelMode = e);
    } catch {
    }
    this._rightPanelMode === "assign" && this._ensureEntityAreaIndex();
  }
  _persistRightPanelModePreference() {
    var t;
    try {
      (t = window.localStorage) == null || t.setItem(Ni, this._rightPanelMode);
    } catch {
    }
  }
  _handleRightPanelModeChange(t) {
    this._rightPanelMode !== t && (this._rightPanelMode = t, this._persistRightPanelModePreference(), t === "assign" && this._ensureEntityAreaIndex());
  }
  _applyPanelSplitFromClientX(t, e = !1) {
    var a;
    const i = (a = this.shadowRoot) == null ? void 0 : a.querySelector(".panel-container");
    if (!i) return;
    const o = i.getBoundingClientRect();
    if (o.width <= 0) return;
    const n = (t - o.left) / o.width;
    this._setPanelSplit(n, e);
  }
  _stopPanelSplitterDrag() {
    this._isResizingPanels = !1, this._panelResizePointerId = void 0, window.removeEventListener("pointermove", this._handlePanelSplitterPointerMove), window.removeEventListener("pointerup", this._handlePanelSplitterPointerUp), window.removeEventListener("pointercancel", this._handlePanelSplitterPointerUp);
  }
  async _subscribeToUpdates() {
    if (!(!this.hass || !this.hass.connection) && typeof this.hass.connection.subscribeEvents == "function") {
      this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubHandoffTrace && (this._unsubHandoffTrace(), this._unsubHandoffTrace = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0), this._unsubEntityRegistryUpdated && (this._unsubEntityRegistryUpdated(), this._unsubEntityRegistryUpdated = void 0), this._unsubDeviceRegistryUpdated && (this._unsubDeviceRegistryUpdated(), this._unsubDeviceRegistryUpdated = void 0), this._unsubAreaRegistryUpdated && (this._unsubAreaRegistryUpdated(), this._unsubAreaRegistryUpdated = void 0);
      try {
        this._unsubUpdates = await this.hass.connection.subscribeEvents(
          (t) => {
            this._logEvent("ha", "topomation_updated", (t == null ? void 0 : t.data) || {}), this._scheduleReload(!0);
          },
          "topomation_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_updated events", t), this._logEvent("error", "subscribe failed: topomation_updated", String(t));
      }
      try {
        this._unsubOccupancyChanged = await this.hass.connection.subscribeEvents(
          (t) => {
            var a, r, c, l;
            const e = (a = t == null ? void 0 : t.data) == null ? void 0 : a.location_id, i = (r = t == null ? void 0 : t.data) == null ? void 0 : r.occupied;
            if (!e || typeof i != "boolean") return;
            const o = (c = t == null ? void 0 : t.data) == null ? void 0 : c.previous_occupied, n = typeof ((l = t == null ? void 0 : t.data) == null ? void 0 : l.reason) == "string" && t.data.reason.trim().length ? t.data.reason.trim() : void 0;
            this._setOccupancyState(e, i, {
              previousOccupied: typeof o == "boolean" ? o : void 0,
              reason: n
            }), this._logEvent("ha", "topomation_occupancy_changed", {
              locationId: e,
              occupied: i,
              previousOccupied: typeof o == "boolean" ? o : void 0,
              reason: n
            });
          },
          "topomation_occupancy_changed"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_occupancy_changed events", t), this._logEvent("error", "subscribe failed: topomation_occupancy_changed", String(t));
      }
      try {
        this._unsubHandoffTrace = await this.hass.connection.subscribeEvents(
          (t) => {
            const e = (t == null ? void 0 : t.data) || {}, i = typeof e.edge_id == "string" && e.edge_id.trim() ? e.edge_id.trim() : "", o = typeof e.from_location_id == "string" && e.from_location_id.trim() ? e.from_location_id.trim() : "", n = typeof e.to_location_id == "string" && e.to_location_id.trim() ? e.to_location_id.trim() : "";
            if (!i || !o || !n) return;
            const a = {
              edge_id: i,
              from_location_id: o,
              to_location_id: n,
              trigger_entity_id: typeof e.trigger_entity_id == "string" ? e.trigger_entity_id : "",
              trigger_source_id: typeof e.trigger_source_id == "string" ? e.trigger_source_id : "",
              boundary_type: typeof e.boundary_type == "string" ? e.boundary_type : "virtual",
              handoff_window_sec: typeof e.handoff_window_sec == "number" ? e.handoff_window_sec : 12,
              status: typeof e.status == "string" ? e.status : "provisional_triggered",
              timestamp: typeof e.timestamp == "string" && e.timestamp.trim() ? e.timestamp : (/* @__PURE__ */ new Date()).toISOString()
            }, r = (l, h, d) => {
              const p = l[h] || [];
              return {
                ...l,
                [h]: [d, ...p].slice(0, 25)
              };
            };
            let c = r(this._handoffTraceByLocation, o, a);
            c = r(c, n, a), this._handoffTraceByLocation = c, this._logEvent("ha", "topomation_handoff_trace", a);
          },
          "topomation_handoff_trace"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_handoff_trace events", t), this._logEvent("error", "subscribe failed: topomation_handoff_trace", String(t));
      }
      try {
        this._unsubActionsSummary = await this.hass.connection.subscribeEvents(
          (t) => {
            this._logEvent("ha", "topomation_actions_summary", (t == null ? void 0 : t.data) || {});
          },
          "topomation_actions_summary"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_actions_summary events", t), this._logEvent("error", "subscribe failed: topomation_actions_summary", String(t));
      }
      try {
        this._unsubEntityRegistryUpdated = await this.hass.connection.subscribeEvents(
          (t) => {
            this._scheduleRegistryRefresh("entity_registry_updated", (t == null ? void 0 : t.data) || {});
          },
          "entity_registry_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to entity_registry_updated events", t), this._logEvent("error", "subscribe failed: entity_registry_updated", String(t));
      }
      try {
        this._unsubDeviceRegistryUpdated = await this.hass.connection.subscribeEvents(
          (t) => {
            this._scheduleRegistryRefresh("device_registry_updated", (t == null ? void 0 : t.data) || {});
          },
          "device_registry_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to device_registry_updated events", t), this._logEvent("error", "subscribe failed: device_registry_updated", String(t));
      }
      try {
        this._unsubAreaRegistryUpdated = await this.hass.connection.subscribeEvents(
          (t) => {
            this._scheduleRegistryRefresh("area_registry_updated", (t == null ? void 0 : t.data) || {});
          },
          "area_registry_updated"
        );
      } catch (t) {
        console.warn("Failed to subscribe to area_registry_updated events", t), this._logEvent("error", "subscribe failed: area_registry_updated", String(t));
      }
      await this._syncStateChangedSubscription();
    }
  }
  _scheduleRegistryRefresh(t, e) {
    this._logEvent("ha", t, e), this._registryRefreshTimer && (window.clearTimeout(this._registryRefreshTimer), this._registryRefreshTimer = void 0), this._registryRefreshTimer = window.setTimeout(() => {
      this._registryRefreshTimer = void 0, this._haRegistryRevision += 1, this._entityAreaIndexLoaded = !1, this._entityAreaRevision += 1, this._rightPanelMode === "assign" && this._ensureEntityAreaIndex(!0), this._scheduleReload(!0);
    }, 200);
  }
  _setOccupancyState(t, e, i) {
    const o = typeof (i == null ? void 0 : i.reason) == "string" && i.reason.trim().length ? i.reason.trim() : void 0, n = typeof (i == null ? void 0 : i.changedAt) == "string" && i.changedAt.trim().length ? i.changedAt : (/* @__PURE__ */ new Date()).toISOString();
    this._occupancyStateByLocation = {
      ...this._occupancyStateByLocation,
      [t]: e
    }, this._occupancyTransitionByLocation = {
      ...this._occupancyTransitionByLocation,
      [t]: {
        occupied: e,
        previousOccupied: typeof (i == null ? void 0 : i.previousOccupied) == "boolean" ? i.previousOccupied : void 0,
        reason: o,
        changedAt: n
      }
    };
  }
  _buildOccupancyStateMapFromStates() {
    var i;
    const t = {}, e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const o of Object.values(e)) {
      const n = (o == null ? void 0 : o.attributes) || {};
      if ((n == null ? void 0 : n.device_class) !== "occupancy") continue;
      const a = n.location_id;
      a && (t[a] = (o == null ? void 0 : o.state) === "on");
    }
    return t;
  }
  _buildOccupancyTransitionsFromStates() {
    var i;
    const t = {}, e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const o of Object.values(e)) {
      const n = (o == null ? void 0 : o.attributes) || {};
      if ((n == null ? void 0 : n.device_class) !== "occupancy") continue;
      const a = n.location_id;
      if (!a) continue;
      const r = n.previous_occupied, c = typeof n.reason == "string" && n.reason.trim().length ? n.reason.trim() : void 0, l = typeof (o == null ? void 0 : o.last_changed) == "string" && o.last_changed.trim().length ? o.last_changed : void 0;
      t[a] = {
        occupied: (o == null ? void 0 : o.state) === "on",
        previousOccupied: typeof r == "boolean" ? r : void 0,
        reason: c,
        changedAt: l
      };
    }
    return t;
  }
  async _syncStateChangedSubscription() {
    var t;
    if ((t = this.hass) != null && t.connection && typeof this.hass.connection.subscribeEvents == "function") {
      if (!this._eventLogOpen) {
        this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0);
        return;
      }
      if (!this._unsubStateChanged)
        try {
          this._unsubStateChanged = await this.hass.connection.subscribeEvents(
            (e) => {
              var c, l, h, d, p, f;
              const i = (c = e == null ? void 0 : e.data) == null ? void 0 : c.entity_id;
              if (!i) return;
              const o = (l = e == null ? void 0 : e.data) == null ? void 0 : l.new_state, n = (o == null ? void 0 : o.attributes) || {};
              if (i.startsWith("binary_sensor.") && n.device_class === "occupancy" && n.location_id && this._setOccupancyState(n.location_id, (o == null ? void 0 : o.state) === "on", {
                previousOccupied: typeof n.previous_occupied == "boolean" ? n.previous_occupied : void 0,
                reason: typeof n.reason == "string" && n.reason.trim().length ? n.reason.trim() : void 0,
                changedAt: typeof (o == null ? void 0 : o.last_changed) == "string" && o.last_changed.trim().length ? o.last_changed : void 0
              }), !this._shouldTrackEntity(i)) return;
              const a = (d = (h = e == null ? void 0 : e.data) == null ? void 0 : h.new_state) == null ? void 0 : d.state, r = (f = (p = e == null ? void 0 : e.data) == null ? void 0 : p.old_state) == null ? void 0 : f.state;
              this._logEvent("ha", "state_changed", { entityId: i, oldState: r, newState: a });
            },
            "state_changed"
          );
        } catch (e) {
          console.warn("Failed to subscribe to state_changed events", e), this._logEvent("error", "subscribe failed: state_changed", String(e));
        }
    }
  }
  _renderEventLog() {
    return g`
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
          ${this._eventLogEntries.length === 0 ? g`<div class="event-log-item event-log-meta">No events captured yet.</div>` : this._eventLogEntries.map(
      (t) => g`
                  <div class="event-log-item">
                    <div class="event-log-meta">[${t.ts}] ${t.type}</div>
                    <div>${t.message}</div>
                    ${t.data !== void 0 ? g`<div class="event-log-meta">${this._safeStringify(t.data)}</div>` : ""}
                  </div>
                `
    )}
        </div>
      </div>
    `;
  }
  _shouldTrackEntity(t) {
    return this._eventLogScope === "all" ? this._isTrackedEntity(t) : this._isTrackedEntityInSelectedSubtree(t);
  }
  _isTrackedEntity(t) {
    var i, o;
    const e = /* @__PURE__ */ new Set();
    for (const n of this._locations) {
      for (const r of n.entity_ids || []) e.add(r);
      const a = ((o = (i = n.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || [];
      for (const r of a) e.add(r.entity_id);
    }
    return e.has(t);
  }
  _isTrackedEntityInSelectedSubtree(t) {
    var i, o;
    const e = this._getSelectedSubtreeLocationIds();
    if (e.size === 0) return !1;
    for (const n of this._locations) {
      if (!e.has(n.id)) continue;
      if ((n.entity_ids || []).includes(t) || (((o = (i = n.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || []).some((r) => r.entity_id === t)) return !0;
    }
    return !1;
  }
  _getSelectedSubtreeLocationIds() {
    const t = /* @__PURE__ */ new Set();
    if (!this._selectedId) return t;
    t.add(this._selectedId);
    let e = !0;
    for (; e; ) {
      e = !1;
      for (const i of this._locations)
        i.parent_id && t.has(i.parent_id) && !t.has(i.id) && (t.add(i.id), e = !0);
    }
    return t;
  }
  _getEventLogScopeLabel() {
    if (this._eventLogScope === "all") return "all locations";
    const t = this._locations.find((i) => i.id === this._selectedId);
    if (!t) return "selected subtree";
    const e = this._getSelectedSubtreeLocationIds().size;
    return `${t.name} subtree (${e} locations)`;
  }
  _safeStringify(t) {
    try {
      return JSON.stringify(t);
    } catch {
      return String(t);
    }
  }
  _logEvent(t, e, i) {
    const o = {
      ts: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      type: t,
      message: e,
      data: i
    };
    this._eventLogEntries = [o, ...this._eventLogEntries].slice(0, 200);
  }
  _showKeyboardShortcutsHelp() {
    const e = [
      { key: "Drag", description: "Move location in hierarchy (tree handle)" },
      { key: "Left/Right", description: "Resize panes when splitter is focused" },
      { key: "?", description: "Show this help" }
    ].map((i) => `${i.key}: ${i.description}`).join(`
`);
    alert(`Keyboard Shortcuts:

${e}`);
  }
  _getSelectedLocation() {
    if (this._selectedId)
      return this._locations.find((t) => t.id === this._selectedId);
  }
  /**
   * Batch save all pending changes
   * See: docs/history/2026.02.24-frontend-patterns.md Section 13.2
   */
  async _handleSaveChanges() {
    if (this._pendingChanges.size === 0 || this._saving) return;
    this._saving = !0;
    const t = Array.from(this._pendingChanges.entries()), e = await Promise.allSettled(
      t.map(([o, n]) => this._saveChange(o, n))
    ), i = e.filter((o) => o.status === "rejected");
    i.length === 0 ? (this._pendingChanges.clear(), this._showToast("All changes saved successfully", "success")) : i.length < e.length ? (this._showToast(`Saved ${e.length - i.length} changes, ${i.length} failed`, "warning"), t.forEach(([o, n], a) => {
      e[a].status === "fulfilled" && this._pendingChanges.delete(o);
    })) : this._showToast("Failed to save changes", "error"), this._saving = !1, await this._loadLocations();
  }
  /**
   * Discard all pending changes and reload from server.
   */
  async _handleDiscardChanges() {
    this._pendingChanges.size === 0 || this._discarding || (this._discarding = !0, this._pendingChanges.clear(), await this._loadLocations(!0), this._discarding = !1);
  }
  async _saveChange(t, e) {
    switch (e.type) {
      case "update":
        await this.hass.callWS(this._withEntryId({
          type: "topomation/locations/update",
          location_id: t,
          changes: e.updated
        }));
        break;
      case "delete":
        await this.hass.callWS(this._withEntryId({
          type: "topomation/locations/delete",
          location_id: t
        }));
        break;
      case "create":
        await this.hass.callWS(this._withEntryId({
          type: "topomation/locations/create",
          ...e.updated
        }));
        break;
    }
  }
  _activeEntryId() {
    var o, n, a, r;
    const t = (n = (o = this.panel) == null ? void 0 : o.config) == null ? void 0 : n.entry_id;
    if (typeof t == "string" && t.trim()) {
      const c = t.trim();
      return this._lastKnownEntryId = c, c;
    }
    const e = (r = (a = this.route) == null ? void 0 : a.path) == null ? void 0 : r.split("?", 2)[1];
    if (e) {
      const c = new URLSearchParams(e).get("entry_id");
      if (c && c.trim()) {
        const l = c.trim();
        return this._lastKnownEntryId = l, l;
      }
    }
    const i = new URLSearchParams(window.location.search).get("entry_id");
    if (i && i.trim()) {
      const c = i.trim();
      return this._lastKnownEntryId = c, c;
    }
    return this._lastKnownEntryId;
  }
  _withEntryId(t) {
    const e = this._activeEntryId();
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _serviceDataWithEntryId(t) {
    const e = this._activeEntryId();
    return e ? {
      ...t,
      entry_id: e
    } : t;
  }
  _showToast(t, e = "success") {
    const i = new CustomEvent("hass-notification", {
      detail: {
        message: t,
        type: e === "error" ? "error" : void 0,
        duration: e === "error" ? 5e3 : 3e3
      },
      bubbles: !0,
      composed: !0
    });
    this.dispatchEvent(i);
  }
  async _seedDemoData() {
    this._showToast(
      "Demo seeding is disabled in this environment.",
      "warning"
    );
  }
  _isManagedShadowLocation(t) {
    var i;
    if (!t) return !1;
    const e = ((i = t.modules) == null ? void 0 : i._meta) || {};
    return String(e.role || "").trim().toLowerCase() === "managed_shadow";
  }
  _parentSelectableLocations() {
    return this._locations.filter((t) => !this._isManagedShadowLocation(t));
  }
  _preferredSelectedLocationId() {
    var t;
    return (t = this._locations.find((e) => !this._isManagedShadowLocation(e))) == null ? void 0 : t.id;
  }
};
we.properties = {
  hass: { attribute: !1 },
  narrow: { attribute: !1 },
  panel: { attribute: !1 },
  route: { attribute: !1 },
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
  _editingLocation: { state: !0 },
  _renameConflict: { state: !0 },
  _newLocationDefaults: { state: !0 },
  _eventLogOpen: { state: !0 },
  _eventLogEntries: { state: !0 },
  _occupancyStateByLocation: { state: !0 },
  _occupancyTransitionByLocation: { state: !0 },
  _adjacencyEdges: { state: !0 },
  _handoffTraceByLocation: { state: !0 },
  _treePanelSplit: { state: !0 },
  _isResizingPanels: { state: !0 },
  _entityAreaById: { state: !0 },
  _entitySearch: { state: !0 },
  _assignBusyByEntityId: { state: !0 },
  _rightPanelMode: { state: !0 },
  _assignmentFilter: { state: !0 },
  _deviceGroupExpanded: { state: !0 },
  _haRegistryRevision: { state: !0 }
}, we.styles = [
  Se,
  Xt`
      :host {
        display: block;
        height: 100%;
        min-height: 100%;
        background: var(--primary-background-color);
      }

      .panel-container {
        --tree-panel-basis: 40%;
        display: flex;
        height: 100%;
        min-width: 0;
      }

      /* Tree Panel defaults to ~40%, now user-resizable via splitter */
      .panel-left {
        flex: 0 0 var(--tree-panel-basis);
        min-width: 300px;
        max-width: calc(100% - 410px);
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .panel-splitter {
        flex: 0 0 10px;
        position: relative;
        cursor: col-resize;
        touch-action: none;
        user-select: none;
      }

      .panel-splitter::before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 4px;
        width: 2px;
        background: var(--divider-color);
        transition: background-color 0.15s ease;
      }

      .panel-splitter:hover::before,
      .panel-splitter.dragging::before,
      .panel-splitter:focus-visible::before {
        background: var(--primary-color);
      }

      .panel-splitter:focus-visible {
        outline: none;
      }

      /* Details Panel ~60% (min 400px) */
      .panel-right {
        flex: 1;
        min-width: 400px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      /* Responsive - from docs/history/2026.02.24-ui-design.md Section 2.2 */
      @media (max-width: 1024px) {
        .panel-left {
          min-width: 280px;
          max-width: calc(100% - 310px);
        }
        .panel-right {
          min-width: 300px;
        }
      }

      @media (max-width: 768px) {
        :host {
          height: auto;
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
          padding-bottom: env(safe-area-inset-bottom);
        }

        .panel-container {
          flex-direction: column;
          height: auto;
        }

        .panel-left,
        .panel-right {
          flex: 0 0 auto;
          min-width: unset;
          max-width: unset;
          overflow: visible;
        }

        .panel-splitter {
          display: none;
        }

        ht-location-tree {
          flex: 0 0 auto;
          min-height: 200px;
          max-height: 52vh;
        }
      }

      /* Header styling - from docs/history/2026.02.24-ui-design.md Section 3.1.1 */
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

      .right-panel-modes {
        margin-top: var(--spacing-sm);
        display: flex;
        gap: 8px;
      }

      .header-actions .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      ht-location-tree {
        flex: 1 1 auto;
        min-height: 0;
      }

      ht-location-inspector {
        flex: 1 1 auto;
        min-height: 0;
      }

      .device-assignment-panel {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 0 var(--spacing-md) var(--spacing-md);
      }

      .device-panel-head {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--card-background-color);
        padding: var(--spacing-md) 0 var(--spacing-sm);
      }

      .device-panel-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 2px;
      }

      .device-panel-subtitle {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .device-search {
        width: 100%;
        margin-top: var(--spacing-sm);
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .device-toolbar {
        margin-top: var(--spacing-sm);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }

      .device-filter-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .device-filter-chip {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 999px;
      }

      .device-group-actions {
        display: flex;
        gap: 6px;
      }

      .device-group {
        margin-top: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        overflow: hidden;
      }

      .device-group-header {
        width: 100%;
        border: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.06);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        cursor: pointer;
        color: var(--primary-text-color);
        text-align: left;
      }

      .device-group-header:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: -2px;
      }

      .device-group-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .device-group-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-group-chevron {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .device-group-count {
        color: var(--text-secondary-color);
        font-weight: 600;
        font-size: 11px;
      }

      .device-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 8px 10px;
        border-top: 1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.06);
        background: var(--card-background-color);
      }

      .device-row[draggable="true"] {
        cursor: grab;
      }

      .device-row[draggable="true"]:active {
        cursor: grabbing;
      }

      .device-name {
        font-size: 13px;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-meta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .device-assign-btn {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 6px;
      }

      .device-empty {
        padding: 14px 10px;
        color: var(--text-secondary-color);
        font-size: 12px;
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

      .empty-state-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        margin: 0 0 16px 0;
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.1);
        border-left: 4px solid var(--primary-color);
        border-radius: 0 4px 4px 0;
      }

      .empty-state-banner ha-icon {
        flex-shrink: 0;
        color: var(--primary-color);
      }

      .empty-state-banner-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
        color: var(--primary-text-color);
      }

      .empty-state-banner .button {
        flex-shrink: 0;
        text-decoration: none;
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
let ti = we;
if (!customElements.get("topomation-panel"))
  try {
    customElements.define("topomation-panel", ti);
  } catch (s) {
    console.error("[topomation-panel] failed to define element", s);
  }
export {
  ti as TopomationPanel
};
