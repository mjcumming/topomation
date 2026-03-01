/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ne = globalThis, Ze = ne.ShadowRoot && (ne.ShadyCSS === void 0 || ne.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ti = Symbol(), ci = /* @__PURE__ */ new WeakMap();
let qi = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== ti) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (Ze && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = ci.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && ci.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const xo = (a) => new qi(typeof a == "string" ? a : a + "", void 0, ti), Xt = (a, ...t) => {
  const e = a.length === 1 ? a[0] : t.reduce((i, o, n) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + a[n + 1], a[0]);
  return new qi(e, a, ti);
}, So = (a, t) => {
  if (Ze) a.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), o = ne.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = e.cssText, a.appendChild(i);
  }
}, li = Ze ? (a) => a : (a) => a instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return xo(e);
})(a) : a;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Eo, defineProperty: $o, getOwnPropertyDescriptor: Ao, getOwnPropertyNames: ko, getOwnPropertySymbols: Do, getPrototypeOf: To } = Object, lt = globalThis, di = lt.trustedTypes, Co = di ? di.emptyScript : "", Ee = lt.reactiveElementPolyfillSupport, zt = (a, t) => a, Ke = { toAttribute(a, t) {
  switch (t) {
    case Boolean:
      a = a ? Co : null;
      break;
    case Object:
    case Array:
      a = a == null ? a : JSON.stringify(a);
  }
  return a;
}, fromAttribute(a, t) {
  let e = a;
  switch (t) {
    case Boolean:
      e = a !== null;
      break;
    case Number:
      e = a === null ? null : Number(a);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(a);
      } catch {
        e = null;
      }
  }
  return e;
} }, Hi = (a, t) => !Eo(a, t), ui = { attribute: !0, type: String, converter: Ke, reflect: !1, useDefault: !1, hasChanged: Hi };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), lt.litPropertyMetadata ?? (lt.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let $t = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = ui) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), o = this.getPropertyDescriptor(t, i, e);
      o !== void 0 && $o(this.prototype, t, o);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: o, set: n } = Ao(this.prototype, t) ?? { get() {
      return this[e];
    }, set(r) {
      this[e] = r;
    } };
    return { get: o, set(r) {
      const s = o == null ? void 0 : o.call(this);
      n == null || n.call(this, r), this.requestUpdate(t, s, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? ui;
  }
  static _$Ei() {
    if (this.hasOwnProperty(zt("elementProperties"))) return;
    const t = To(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(zt("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(zt("properties"))) {
      const e = this.properties, i = [...ko(e), ...Do(e)];
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
      for (const o of i) e.unshift(li(o));
    } else t !== void 0 && e.push(li(t));
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
    return So(t, this.constructor.elementStyles), t;
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
      const r = (((n = i.converter) == null ? void 0 : n.toAttribute) !== void 0 ? i.converter : Ke).toAttribute(e, i.type);
      this._$Em = t, r == null ? this.removeAttribute(o) : this.setAttribute(o, r), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var n, r;
    const i = this.constructor, o = i._$Eh.get(t);
    if (o !== void 0 && this._$Em !== o) {
      const s = i.getPropertyOptions(o), c = typeof s.converter == "function" ? { fromAttribute: s.converter } : ((n = s.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? s.converter : Ke;
      this._$Em = o;
      const d = c.fromAttribute(e, s.type);
      this[o] = d ?? ((r = this._$Ej) == null ? void 0 : r.get(o)) ?? d, this._$Em = null;
    }
  }
  requestUpdate(t, e, i) {
    var o;
    if (t !== void 0) {
      const n = this.constructor, r = this[t];
      if (i ?? (i = n.getPropertyOptions(t)), !((i.hasChanged ?? Hi)(r, e) || i.useDefault && i.reflect && r === ((o = this._$Ej) == null ? void 0 : o.get(t)) && !this.hasAttribute(n._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: o, wrapped: n }, r) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, r ?? e ?? this[t]), n !== !0 || r !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), o === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
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
        for (const [n, r] of this._$Ep) this[n] = r;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [n, r] of o) {
        const { wrapped: s } = r, c = this[n];
        s !== !0 || this._$AL.has(n) || c === void 0 || this.C(n, void 0, r, c);
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
$t.elementStyles = [], $t.shadowRootOptions = { mode: "open" }, $t[zt("elementProperties")] = /* @__PURE__ */ new Map(), $t[zt("finalized")] = /* @__PURE__ */ new Map(), Ee == null || Ee({ ReactiveElement: $t }), (lt.reactiveElementVersions ?? (lt.reactiveElementVersions = [])).push("2.1.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ut = globalThis, de = Ut.trustedTypes, hi = de ? de.createPolicy("lit-html", { createHTML: (a) => a }) : void 0, Wi = "$lit$", at = `lit$${Math.random().toFixed(9).slice(2)}$`, ji = "?" + at, Io = `<${ji}>`, wt = document, Vt = () => wt.createComment(""), Gt = (a) => a === null || typeof a != "object" && typeof a != "function", ei = Array.isArray, Lo = (a) => ei(a) || typeof (a == null ? void 0 : a[Symbol.iterator]) == "function", $e = `[ 	
\f\r]`, Ot = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, pi = /-->/g, fi = />/g, pt = RegExp(`>|${$e}(?:([^\\s"'>=/]+)(${$e}*=${$e}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), gi = /'/g, _i = /"/g, Vi = /^(?:script|style|textarea|title)$/i, Po = (a) => (t, ...e) => ({ _$litType$: a, strings: t, values: e }), m = Po(1), G = Symbol.for("lit-noChange"), P = Symbol.for("lit-nothing"), mi = /* @__PURE__ */ new WeakMap(), yt = wt.createTreeWalker(wt, 129);
function Gi(a, t) {
  if (!ei(a) || !a.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return hi !== void 0 ? hi.createHTML(t) : t;
}
const Ro = (a, t) => {
  const e = a.length - 1, i = [];
  let o, n = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = Ot;
  for (let s = 0; s < e; s++) {
    const c = a[s];
    let d, u, l = -1, h = 0;
    for (; h < c.length && (r.lastIndex = h, u = r.exec(c), u !== null); ) h = r.lastIndex, r === Ot ? u[1] === "!--" ? r = pi : u[1] !== void 0 ? r = fi : u[2] !== void 0 ? (Vi.test(u[2]) && (o = RegExp("</" + u[2], "g")), r = pt) : u[3] !== void 0 && (r = pt) : r === pt ? u[0] === ">" ? (r = o ?? Ot, l = -1) : u[1] === void 0 ? l = -2 : (l = r.lastIndex - u[2].length, d = u[1], r = u[3] === void 0 ? pt : u[3] === '"' ? _i : gi) : r === _i || r === gi ? r = pt : r === pi || r === fi ? r = Ot : (r = pt, o = void 0);
    const f = r === pt && a[s + 1].startsWith("/>") ? " " : "";
    n += r === Ot ? c + Io : l >= 0 ? (i.push(d), c.slice(0, l) + Wi + c.slice(l) + at + f) : c + at + (l === -2 ? s : f);
  }
  return [Gi(a, n + (a[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class Yt {
  constructor({ strings: t, _$litType$: e }, i) {
    let o;
    this.parts = [];
    let n = 0, r = 0;
    const s = t.length - 1, c = this.parts, [d, u] = Ro(t, e);
    if (this.el = Yt.createElement(d, i), yt.currentNode = this.el.content, e === 2 || e === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (o = yt.nextNode()) !== null && c.length < s; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const l of o.getAttributeNames()) if (l.endsWith(Wi)) {
          const h = u[r++], f = o.getAttribute(l).split(at), p = /([.?@])?(.*)/.exec(h);
          c.push({ type: 1, index: n, name: p[2], strings: f, ctor: p[1] === "." ? Mo : p[1] === "?" ? No : p[1] === "@" ? Bo : we }), o.removeAttribute(l);
        } else l.startsWith(at) && (c.push({ type: 6, index: n }), o.removeAttribute(l));
        if (Vi.test(o.tagName)) {
          const l = o.textContent.split(at), h = l.length - 1;
          if (h > 0) {
            o.textContent = de ? de.emptyScript : "";
            for (let f = 0; f < h; f++) o.append(l[f], Vt()), yt.nextNode(), c.push({ type: 2, index: ++n });
            o.append(l[h], Vt());
          }
        }
      } else if (o.nodeType === 8) if (o.data === ji) c.push({ type: 2, index: n });
      else {
        let l = -1;
        for (; (l = o.data.indexOf(at, l + 1)) !== -1; ) c.push({ type: 7, index: n }), l += at.length - 1;
      }
      n++;
    }
  }
  static createElement(t, e) {
    const i = wt.createElement("template");
    return i.innerHTML = t, i;
  }
}
function Tt(a, t, e = a, i) {
  var r, s;
  if (t === G) return t;
  let o = i !== void 0 ? (r = e._$Co) == null ? void 0 : r[i] : e._$Cl;
  const n = Gt(t) ? void 0 : t._$litDirective$;
  return (o == null ? void 0 : o.constructor) !== n && ((s = o == null ? void 0 : o._$AO) == null || s.call(o, !1), n === void 0 ? o = void 0 : (o = new n(a), o._$AT(a, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = o : e._$Cl = o), o !== void 0 && (t = Tt(a, o._$AS(a, t.values), o, i)), t;
}
let Oo = class {
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
    const { el: { content: e }, parts: i } = this._$AD, o = ((t == null ? void 0 : t.creationScope) ?? wt).importNode(e, !0);
    yt.currentNode = o;
    let n = yt.nextNode(), r = 0, s = 0, c = i[0];
    for (; c !== void 0; ) {
      if (r === c.index) {
        let d;
        c.type === 2 ? d = new It(n, n.nextSibling, this, t) : c.type === 1 ? d = new c.ctor(n, c.name, c.strings, this, t) : c.type === 6 && (d = new Fo(n, this, t)), this._$AV.push(d), c = i[++s];
      }
      r !== (c == null ? void 0 : c.index) && (n = yt.nextNode(), r++);
    }
    return yt.currentNode = wt, o;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
};
class It {
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
    t = Tt(this, t, e), Gt(t) ? t === P || t == null || t === "" ? (this._$AH !== P && this._$AR(), this._$AH = P) : t !== this._$AH && t !== G && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Lo(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== P && Gt(this._$AH) ? this._$AA.nextSibling.data = t : this.T(wt.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var n;
    const { values: e, _$litType$: i } = t, o = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = Yt.createElement(Gi(i.h, i.h[0]), this.options)), i);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === o) this._$AH.p(e);
    else {
      const r = new Oo(o, this), s = r.u(this.options);
      r.p(e), this.T(s), this._$AH = r;
    }
  }
  _$AC(t) {
    let e = mi.get(t.strings);
    return e === void 0 && mi.set(t.strings, e = new Yt(t)), e;
  }
  k(t) {
    ei(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, o = 0;
    for (const n of t) o === e.length ? e.push(i = new It(this.O(Vt()), this.O(Vt()), this, this.options)) : i = e[o], i._$AI(n), o++;
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
class we {
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
    let r = !1;
    if (n === void 0) t = Tt(this, t, e, 0), r = !Gt(t) || t !== this._$AH && t !== G, r && (this._$AH = t);
    else {
      const s = t;
      let c, d;
      for (t = n[0], c = 0; c < n.length - 1; c++) d = Tt(this, s[i + c], e, c), d === G && (d = this._$AH[c]), r || (r = !Gt(d) || d !== this._$AH[c]), d === P ? t = P : t !== P && (t += (d ?? "") + n[c + 1]), this._$AH[c] = d;
    }
    r && !o && this.j(t);
  }
  j(t) {
    t === P ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Mo extends we {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === P ? void 0 : t;
  }
}
class No extends we {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== P);
  }
}
class Bo extends we {
  constructor(t, e, i, o, n) {
    super(t, e, i, o, n), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = Tt(this, t, e, 0) ?? P) === G) return;
    const i = this._$AH, o = t === P && i !== P || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, n = t !== P && (i === P || o);
    o && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Fo {
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
const zo = { I: It }, Ae = Ut.litHtmlPolyfillSupport;
Ae == null || Ae(Yt, It), (Ut.litHtmlVersions ?? (Ut.litHtmlVersions = [])).push("3.3.1");
const Uo = (a, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let o = i._$litPart$;
  if (o === void 0) {
    const n = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = o = new It(t.insertBefore(Vt(), n), n, void 0, e ?? {});
  }
  return o._$AI(a), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const bt = globalThis;
let dt = class extends $t {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Uo(e, this.renderRoot, this.renderOptions);
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
    return G;
  }
};
var Mi;
dt._$litElement$ = !0, dt.finalized = !0, (Mi = bt.litElementHydrateSupport) == null || Mi.call(bt, { LitElement: dt });
const ke = bt.litElementPolyfillSupport;
ke == null || ke({ LitElement: dt });
(bt.litElementVersions ?? (bt.litElementVersions = [])).push("4.2.1");
const xe = Xt`
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
}, Yi = /* @__PURE__ */ new Set(["building", "grounds"]);
function qo(a) {
  const t = String(a ?? "area").trim().toLowerCase(), e = Ko[t] ?? t;
  return e === "floor" || e === "area" || e === "building" || e === "grounds" || e === "subarea" ? e : "area";
}
function xt(a) {
  var t, e;
  return qo((e = (t = a.modules) == null ? void 0 : t._meta) == null ? void 0 : e.type);
}
function qe(a) {
  return a === "floor" ? ["root", "building"] : Yi.has(a) ? ["root"] : a === "subarea" ? ["root", "floor", "area", "subarea", "building", "grounds"] : ["root", "floor", "area", "building", "grounds"];
}
function Ho(a, t) {
  return qe(a).includes(t);
}
function Wo(a) {
  var c;
  const { locations: t, locationId: e, newParentId: i } = a;
  if (i === e || i && He(t, e, i)) return !1;
  const o = new Map(t.map((d) => [d.id, d])), n = o.get(e);
  if (!n || i && !o.get(i) || i && ((c = o.get(i)) != null && c.is_explicit_root)) return !1;
  const r = xt(n);
  if (Yi.has(r))
    return i === null;
  const s = i === null ? "root" : xt(o.get(i) ?? {});
  return !!Ho(r, s);
}
function He(a, t, e) {
  if (t === e) return !1;
  const i = new Map(a.map((r) => [r.id, r]));
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
const mt = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4 }, Xi = (a) => (...t) => ({ _$litDirective$: a, values: t });
class Qi {
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
const { I: jo } = zo, Vo = (a) => a.strings === void 0, vi = () => document.createComment(""), Mt = (a, t, e) => {
  var n;
  const i = a._$AA.parentNode, o = t === void 0 ? a._$AB : t._$AA;
  if (e === void 0) {
    const r = i.insertBefore(vi(), o), s = i.insertBefore(vi(), o);
    e = new jo(r, s, a, a.options);
  } else {
    const r = e._$AB.nextSibling, s = e._$AM, c = s !== a;
    if (c) {
      let d;
      (n = e._$AQ) == null || n.call(e, a), e._$AM = a, e._$AP !== void 0 && (d = a._$AU) !== s._$AU && e._$AP(d);
    }
    if (r !== o || c) {
      let d = e._$AA;
      for (; d !== r; ) {
        const u = d.nextSibling;
        i.insertBefore(d, o), d = u;
      }
    }
  }
  return e;
}, ft = (a, t, e = a) => (a._$AI(t, e), a), Go = {}, Ji = (a, t = Go) => a._$AH = t, Yo = (a) => a._$AH, De = (a) => {
  a._$AR(), a._$AA.remove();
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const yi = (a, t, e) => {
  const i = /* @__PURE__ */ new Map();
  for (let o = t; o <= e; o++) i.set(a[o], o);
  return i;
}, Xo = Xi(class extends Qi {
  constructor(a) {
    if (super(a), a.type !== mt.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(a, t, e) {
    let i;
    e === void 0 ? e = t : t !== void 0 && (i = t);
    const o = [], n = [];
    let r = 0;
    for (const s of a) o[r] = i ? i(s, r) : r, n[r] = e(s, r), r++;
    return { values: n, keys: o };
  }
  render(a, t, e) {
    return this.dt(a, t, e).values;
  }
  update(a, [t, e, i]) {
    const o = Yo(a), { values: n, keys: r } = this.dt(t, e, i);
    if (!Array.isArray(o)) return this.ut = r, n;
    const s = this.ut ?? (this.ut = []), c = [];
    let d, u, l = 0, h = o.length - 1, f = 0, p = n.length - 1;
    for (; l <= h && f <= p; ) if (o[l] === null) l++;
    else if (o[h] === null) h--;
    else if (s[l] === r[f]) c[f] = ft(o[l], n[f]), l++, f++;
    else if (s[h] === r[p]) c[p] = ft(o[h], n[p]), h--, p--;
    else if (s[l] === r[p]) c[p] = ft(o[l], n[p]), Mt(a, c[p + 1], o[l]), l++, p--;
    else if (s[h] === r[f]) c[f] = ft(o[h], n[f]), Mt(a, o[l], o[h]), h--, f++;
    else if (d === void 0 && (d = yi(r, f, p), u = yi(s, l, h)), d.has(s[l])) if (d.has(s[h])) {
      const g = u.get(r[f]), v = g !== void 0 ? o[g] : null;
      if (v === null) {
        const $ = Mt(a, o[l]);
        ft($, n[f]), c[f] = $;
      } else c[f] = ft(v, n[f]), Mt(a, o[l], v), o[g] = null;
      f++;
    } else De(o[h]), h--;
    else De(o[l]), l++;
    for (; f <= p; ) {
      const g = Mt(a, c[p + 1]);
      ft(g, n[f]), c[f++] = g;
    }
    for (; l <= h; ) {
      const g = o[l++];
      g !== null && De(g);
    }
    return this.ut = r, Ji(a, c), G;
  }
});
/**!
 * Sortable 1.15.6
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */
function bi(a, t) {
  var e = Object.keys(a);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(a);
    t && (i = i.filter(function(o) {
      return Object.getOwnPropertyDescriptor(a, o).enumerable;
    })), e.push.apply(e, i);
  }
  return e;
}
function Q(a) {
  for (var t = 1; t < arguments.length; t++) {
    var e = arguments[t] != null ? arguments[t] : {};
    t % 2 ? bi(Object(e), !0).forEach(function(i) {
      Qo(a, i, e[i]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(a, Object.getOwnPropertyDescriptors(e)) : bi(Object(e)).forEach(function(i) {
      Object.defineProperty(a, i, Object.getOwnPropertyDescriptor(e, i));
    });
  }
  return a;
}
function ae(a) {
  "@babel/helpers - typeof";
  return typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? ae = function(t) {
    return typeof t;
  } : ae = function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, ae(a);
}
function Qo(a, t, e) {
  return t in a ? Object.defineProperty(a, t, {
    value: e,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : a[t] = e, a;
}
function tt() {
  return tt = Object.assign || function(a) {
    for (var t = 1; t < arguments.length; t++) {
      var e = arguments[t];
      for (var i in e)
        Object.prototype.hasOwnProperty.call(e, i) && (a[i] = e[i]);
    }
    return a;
  }, tt.apply(this, arguments);
}
function Jo(a, t) {
  if (a == null) return {};
  var e = {}, i = Object.keys(a), o, n;
  for (n = 0; n < i.length; n++)
    o = i[n], !(t.indexOf(o) >= 0) && (e[o] = a[o]);
  return e;
}
function Zo(a, t) {
  if (a == null) return {};
  var e = Jo(a, t), i, o;
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(a);
    for (o = 0; o < n.length; o++)
      i = n[o], !(t.indexOf(i) >= 0) && Object.prototype.propertyIsEnumerable.call(a, i) && (e[i] = a[i]);
  }
  return e;
}
var tn = "1.15.6";
function Z(a) {
  if (typeof window < "u" && window.navigator)
    return !!/* @__PURE__ */ navigator.userAgent.match(a);
}
var et = Z(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i), Qt = Z(/Edge/i), wi = Z(/firefox/i), Kt = Z(/safari/i) && !Z(/chrome/i) && !Z(/android/i), ii = Z(/iP(ad|od|hone)/i), Zi = Z(/chrome/i) && Z(/android/i), to = {
  capture: !1,
  passive: !1
};
function E(a, t, e) {
  a.addEventListener(t, e, !et && to);
}
function S(a, t, e) {
  a.removeEventListener(t, e, !et && to);
}
function ue(a, t) {
  if (t) {
    if (t[0] === ">" && (t = t.substring(1)), a)
      try {
        if (a.matches)
          return a.matches(t);
        if (a.msMatchesSelector)
          return a.msMatchesSelector(t);
        if (a.webkitMatchesSelector)
          return a.webkitMatchesSelector(t);
      } catch {
        return !1;
      }
    return !1;
  }
}
function eo(a) {
  return a.host && a !== document && a.host.nodeType ? a.host : a.parentNode;
}
function V(a, t, e, i) {
  if (a) {
    e = e || document;
    do {
      if (t != null && (t[0] === ">" ? a.parentNode === e && ue(a, t) : ue(a, t)) || i && a === e)
        return a;
      if (a === e) break;
    } while (a = eo(a));
  }
  return null;
}
var xi = /\s+/g;
function q(a, t, e) {
  if (a && t)
    if (a.classList)
      a.classList[e ? "add" : "remove"](t);
    else {
      var i = (" " + a.className + " ").replace(xi, " ").replace(" " + t + " ", " ");
      a.className = (i + (e ? " " + t : "")).replace(xi, " ");
    }
}
function y(a, t, e) {
  var i = a && a.style;
  if (i) {
    if (e === void 0)
      return document.defaultView && document.defaultView.getComputedStyle ? e = document.defaultView.getComputedStyle(a, "") : a.currentStyle && (e = a.currentStyle), t === void 0 ? e : e[t];
    !(t in i) && t.indexOf("webkit") === -1 && (t = "-webkit-" + t), i[t] = e + (typeof e == "string" ? "" : "px");
  }
}
function Dt(a, t) {
  var e = "";
  if (typeof a == "string")
    e = a;
  else
    do {
      var i = y(a, "transform");
      i && i !== "none" && (e = i + " " + e);
    } while (!t && (a = a.parentNode));
  var o = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return o && new o(e);
}
function io(a, t, e) {
  if (a) {
    var i = a.getElementsByTagName(t), o = 0, n = i.length;
    if (e)
      for (; o < n; o++)
        e(i[o], o);
    return i;
  }
  return [];
}
function X() {
  var a = document.scrollingElement;
  return a || document.documentElement;
}
function L(a, t, e, i, o) {
  if (!(!a.getBoundingClientRect && a !== window)) {
    var n, r, s, c, d, u, l;
    if (a !== window && a.parentNode && a !== X() ? (n = a.getBoundingClientRect(), r = n.top, s = n.left, c = n.bottom, d = n.right, u = n.height, l = n.width) : (r = 0, s = 0, c = window.innerHeight, d = window.innerWidth, u = window.innerHeight, l = window.innerWidth), (t || e) && a !== window && (o = o || a.parentNode, !et))
      do
        if (o && o.getBoundingClientRect && (y(o, "transform") !== "none" || e && y(o, "position") !== "static")) {
          var h = o.getBoundingClientRect();
          r -= h.top + parseInt(y(o, "border-top-width")), s -= h.left + parseInt(y(o, "border-left-width")), c = r + n.height, d = s + n.width;
          break;
        }
      while (o = o.parentNode);
    if (i && a !== window) {
      var f = Dt(o || a), p = f && f.a, g = f && f.d;
      f && (r /= g, s /= p, l /= p, u /= g, c = r + u, d = s + l);
    }
    return {
      top: r,
      left: s,
      bottom: c,
      right: d,
      width: l,
      height: u
    };
  }
}
function Si(a, t, e) {
  for (var i = ct(a, !0), o = L(a)[t]; i; ) {
    var n = L(i)[e], r = void 0;
    if (r = o >= n, !r) return i;
    if (i === X()) break;
    i = ct(i, !1);
  }
  return !1;
}
function Ct(a, t, e, i) {
  for (var o = 0, n = 0, r = a.children; n < r.length; ) {
    if (r[n].style.display !== "none" && r[n] !== b.ghost && (i || r[n] !== b.dragged) && V(r[n], e.draggable, a, !1)) {
      if (o === t)
        return r[n];
      o++;
    }
    n++;
  }
  return null;
}
function oi(a, t) {
  for (var e = a.lastElementChild; e && (e === b.ghost || y(e, "display") === "none" || t && !ue(e, t)); )
    e = e.previousElementSibling;
  return e || null;
}
function W(a, t) {
  var e = 0;
  if (!a || !a.parentNode)
    return -1;
  for (; a = a.previousElementSibling; )
    a.nodeName.toUpperCase() !== "TEMPLATE" && a !== b.clone && (!t || ue(a, t)) && e++;
  return e;
}
function Ei(a) {
  var t = 0, e = 0, i = X();
  if (a)
    do {
      var o = Dt(a), n = o.a, r = o.d;
      t += a.scrollLeft * n, e += a.scrollTop * r;
    } while (a !== i && (a = a.parentNode));
  return [t, e];
}
function en(a, t) {
  for (var e in a)
    if (a.hasOwnProperty(e)) {
      for (var i in t)
        if (t.hasOwnProperty(i) && t[i] === a[e][i]) return Number(e);
    }
  return -1;
}
function ct(a, t) {
  if (!a || !a.getBoundingClientRect) return X();
  var e = a, i = !1;
  do
    if (e.clientWidth < e.scrollWidth || e.clientHeight < e.scrollHeight) {
      var o = y(e);
      if (e.clientWidth < e.scrollWidth && (o.overflowX == "auto" || o.overflowX == "scroll") || e.clientHeight < e.scrollHeight && (o.overflowY == "auto" || o.overflowY == "scroll")) {
        if (!e.getBoundingClientRect || e === document.body) return X();
        if (i || t) return e;
        i = !0;
      }
    }
  while (e = e.parentNode);
  return X();
}
function on(a, t) {
  if (a && t)
    for (var e in t)
      t.hasOwnProperty(e) && (a[e] = t[e]);
  return a;
}
function Te(a, t) {
  return Math.round(a.top) === Math.round(t.top) && Math.round(a.left) === Math.round(t.left) && Math.round(a.height) === Math.round(t.height) && Math.round(a.width) === Math.round(t.width);
}
var qt;
function oo(a, t) {
  return function() {
    if (!qt) {
      var e = arguments, i = this;
      e.length === 1 ? a.call(i, e[0]) : a.apply(i, e), qt = setTimeout(function() {
        qt = void 0;
      }, t);
    }
  };
}
function nn() {
  clearTimeout(qt), qt = void 0;
}
function no(a, t, e) {
  a.scrollLeft += t, a.scrollTop += e;
}
function ao(a) {
  var t = window.Polymer, e = window.jQuery || window.Zepto;
  return t && t.dom ? t.dom(a).cloneNode(!0) : e ? e(a).clone(!0)[0] : a.cloneNode(!0);
}
function ro(a, t, e) {
  var i = {};
  return Array.from(a.children).forEach(function(o) {
    var n, r, s, c;
    if (!(!V(o, t.draggable, a, !1) || o.animated || o === e)) {
      var d = L(o);
      i.left = Math.min((n = i.left) !== null && n !== void 0 ? n : 1 / 0, d.left), i.top = Math.min((r = i.top) !== null && r !== void 0 ? r : 1 / 0, d.top), i.right = Math.max((s = i.right) !== null && s !== void 0 ? s : -1 / 0, d.right), i.bottom = Math.max((c = i.bottom) !== null && c !== void 0 ? c : -1 / 0, d.bottom);
    }
  }), i.width = i.right - i.left, i.height = i.bottom - i.top, i.x = i.left, i.y = i.top, i;
}
var K = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
function an() {
  var a = [], t;
  return {
    captureAnimationState: function() {
      if (a = [], !!this.options.animation) {
        var i = [].slice.call(this.el.children);
        i.forEach(function(o) {
          if (!(y(o, "display") === "none" || o === b.ghost)) {
            a.push({
              target: o,
              rect: L(o)
            });
            var n = Q({}, a[a.length - 1].rect);
            if (o.thisAnimationDuration) {
              var r = Dt(o, !0);
              r && (n.top -= r.f, n.left -= r.e);
            }
            o.fromRect = n;
          }
        });
      }
    },
    addAnimationState: function(i) {
      a.push(i);
    },
    removeAnimationState: function(i) {
      a.splice(en(a, {
        target: i
      }), 1);
    },
    animateAll: function(i) {
      var o = this;
      if (!this.options.animation) {
        clearTimeout(t), typeof i == "function" && i();
        return;
      }
      var n = !1, r = 0;
      a.forEach(function(s) {
        var c = 0, d = s.target, u = d.fromRect, l = L(d), h = d.prevFromRect, f = d.prevToRect, p = s.rect, g = Dt(d, !0);
        g && (l.top -= g.f, l.left -= g.e), d.toRect = l, d.thisAnimationDuration && Te(h, l) && !Te(u, l) && // Make sure animatingRect is on line between toRect & fromRect
        (p.top - l.top) / (p.left - l.left) === (u.top - l.top) / (u.left - l.left) && (c = sn(p, h, f, o.options)), Te(l, u) || (d.prevFromRect = u, d.prevToRect = l, c || (c = o.options.animation), o.animate(d, p, l, c)), c && (n = !0, r = Math.max(r, c), clearTimeout(d.animationResetTimer), d.animationResetTimer = setTimeout(function() {
          d.animationTime = 0, d.prevFromRect = null, d.fromRect = null, d.prevToRect = null, d.thisAnimationDuration = null;
        }, c), d.thisAnimationDuration = c);
      }), clearTimeout(t), n ? t = setTimeout(function() {
        typeof i == "function" && i();
      }, r) : typeof i == "function" && i(), a = [];
    },
    animate: function(i, o, n, r) {
      if (r) {
        y(i, "transition", ""), y(i, "transform", "");
        var s = Dt(this.el), c = s && s.a, d = s && s.d, u = (o.left - n.left) / (c || 1), l = (o.top - n.top) / (d || 1);
        i.animatingX = !!u, i.animatingY = !!l, y(i, "transform", "translate3d(" + u + "px," + l + "px,0)"), this.forRepaintDummy = rn(i), y(i, "transition", "transform " + r + "ms" + (this.options.easing ? " " + this.options.easing : "")), y(i, "transform", "translate3d(0,0,0)"), typeof i.animated == "number" && clearTimeout(i.animated), i.animated = setTimeout(function() {
          y(i, "transition", ""), y(i, "transform", ""), i.animated = !1, i.animatingX = !1, i.animatingY = !1;
        }, r);
      }
    }
  };
}
function rn(a) {
  return a.offsetWidth;
}
function sn(a, t, e, i) {
  return Math.sqrt(Math.pow(t.top - a.top, 2) + Math.pow(t.left - a.left, 2)) / Math.sqrt(Math.pow(t.top - e.top, 2) + Math.pow(t.left - e.left, 2)) * i.animation;
}
var St = [], Ce = {
  initializeByDefault: !0
}, Jt = {
  mount: function(t) {
    for (var e in Ce)
      Ce.hasOwnProperty(e) && !(e in t) && (t[e] = Ce[e]);
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
    St.forEach(function(r) {
      e[r.pluginName] && (e[r.pluginName][n] && e[r.pluginName][n](Q({
        sortable: e
      }, i)), e.options[r.pluginName] && e[r.pluginName][t] && e[r.pluginName][t](Q({
        sortable: e
      }, i)));
    });
  },
  initializePlugins: function(t, e, i, o) {
    St.forEach(function(s) {
      var c = s.pluginName;
      if (!(!t.options[c] && !s.initializeByDefault)) {
        var d = new s(t, e, t.options);
        d.sortable = t, d.options = t.options, t[c] = d, tt(i, d.defaults);
      }
    });
    for (var n in t.options)
      if (t.options.hasOwnProperty(n)) {
        var r = this.modifyOption(t, n, t.options[n]);
        typeof r < "u" && (t.options[n] = r);
      }
  },
  getEventProperties: function(t, e) {
    var i = {};
    return St.forEach(function(o) {
      typeof o.eventProperties == "function" && tt(i, o.eventProperties.call(e[o.pluginName], t));
    }), i;
  },
  modifyOption: function(t, e, i) {
    var o;
    return St.forEach(function(n) {
      t[n.pluginName] && n.optionListeners && typeof n.optionListeners[e] == "function" && (o = n.optionListeners[e].call(t[n.pluginName], i));
    }), o;
  }
};
function cn(a) {
  var t = a.sortable, e = a.rootEl, i = a.name, o = a.targetEl, n = a.cloneEl, r = a.toEl, s = a.fromEl, c = a.oldIndex, d = a.newIndex, u = a.oldDraggableIndex, l = a.newDraggableIndex, h = a.originalEvent, f = a.putSortable, p = a.extraEventProperties;
  if (t = t || e && e[K], !!t) {
    var g, v = t.options, $ = "on" + i.charAt(0).toUpperCase() + i.substr(1);
    window.CustomEvent && !et && !Qt ? g = new CustomEvent(i, {
      bubbles: !0,
      cancelable: !0
    }) : (g = document.createEvent("Event"), g.initEvent(i, !0, !0)), g.to = r || e, g.from = s || e, g.item = o || e, g.clone = n, g.oldIndex = c, g.newIndex = d, g.oldDraggableIndex = u, g.newDraggableIndex = l, g.originalEvent = h, g.pullMode = f ? f.lastPutMode : void 0;
    var A = Q(Q({}, p), Jt.getEventProperties(i, t));
    for (var k in A)
      g[k] = A[k];
    e && e.dispatchEvent(g), v[$] && v[$].call(t, g);
  }
}
var ln = ["evt"], U = function(t, e) {
  var i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, o = i.evt, n = Zo(i, ln);
  Jt.pluginEvent.bind(b)(t, e, Q({
    dragEl: _,
    parentEl: C,
    ghostEl: w,
    rootEl: D,
    nextEl: vt,
    lastDownEl: re,
    cloneEl: T,
    cloneHidden: rt,
    dragStarted: Nt,
    putSortable: R,
    activeSortable: b.active,
    originalEvent: o,
    oldIndex: kt,
    oldDraggableIndex: Ht,
    newIndex: H,
    newDraggableIndex: nt,
    hideGhostForTarget: uo,
    unhideGhostForTarget: ho,
    cloneNowHidden: function() {
      rt = !0;
    },
    cloneNowShown: function() {
      rt = !1;
    },
    dispatchSortableEvent: function(s) {
      z({
        sortable: e,
        name: s,
        originalEvent: o
      });
    }
  }, n));
};
function z(a) {
  cn(Q({
    putSortable: R,
    cloneEl: T,
    targetEl: _,
    rootEl: D,
    oldIndex: kt,
    oldDraggableIndex: Ht,
    newIndex: H,
    newDraggableIndex: nt
  }, a));
}
var _, C, w, D, vt, re, T, rt, kt, H, Ht, nt, te, R, At = !1, he = !1, pe = [], gt, j, Ie, Le, $i, Ai, Nt, Et, Wt, jt = !1, ee = !1, se, N, Pe = [], We = !1, fe = [], Se = typeof document < "u", ie = ii, ki = Qt || et ? "cssFloat" : "float", dn = Se && !Zi && !ii && "draggable" in document.createElement("div"), so = function() {
  if (Se) {
    if (et)
      return !1;
    var a = document.createElement("x");
    return a.style.cssText = "pointer-events:auto", a.style.pointerEvents === "auto";
  }
}(), co = function(t, e) {
  var i = y(t), o = parseInt(i.width) - parseInt(i.paddingLeft) - parseInt(i.paddingRight) - parseInt(i.borderLeftWidth) - parseInt(i.borderRightWidth), n = Ct(t, 0, e), r = Ct(t, 1, e), s = n && y(n), c = r && y(r), d = s && parseInt(s.marginLeft) + parseInt(s.marginRight) + L(n).width, u = c && parseInt(c.marginLeft) + parseInt(c.marginRight) + L(r).width;
  if (i.display === "flex")
    return i.flexDirection === "column" || i.flexDirection === "column-reverse" ? "vertical" : "horizontal";
  if (i.display === "grid")
    return i.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
  if (n && s.float && s.float !== "none") {
    var l = s.float === "left" ? "left" : "right";
    return r && (c.clear === "both" || c.clear === l) ? "vertical" : "horizontal";
  }
  return n && (s.display === "block" || s.display === "flex" || s.display === "table" || s.display === "grid" || d >= o && i[ki] === "none" || r && i[ki] === "none" && d + u > o) ? "vertical" : "horizontal";
}, un = function(t, e, i) {
  var o = i ? t.left : t.top, n = i ? t.right : t.bottom, r = i ? t.width : t.height, s = i ? e.left : e.top, c = i ? e.right : e.bottom, d = i ? e.width : e.height;
  return o === s || n === c || o + r / 2 === s + d / 2;
}, hn = function(t, e) {
  var i;
  return pe.some(function(o) {
    var n = o[K].options.emptyInsertThreshold;
    if (!(!n || oi(o))) {
      var r = L(o), s = t >= r.left - n && t <= r.right + n, c = e >= r.top - n && e <= r.bottom + n;
      if (s && c)
        return i = o;
    }
  }), i;
}, lo = function(t) {
  function e(n, r) {
    return function(s, c, d, u) {
      var l = s.options.group.name && c.options.group.name && s.options.group.name === c.options.group.name;
      if (n == null && (r || l))
        return !0;
      if (n == null || n === !1)
        return !1;
      if (r && n === "clone")
        return n;
      if (typeof n == "function")
        return e(n(s, c, d, u), r)(s, c, d, u);
      var h = (r ? s : c).options.group.name;
      return n === !0 || typeof n == "string" && n === h || n.join && n.indexOf(h) > -1;
    };
  }
  var i = {}, o = t.group;
  (!o || ae(o) != "object") && (o = {
    name: o
  }), i.name = o.name, i.checkPull = e(o.pull, !0), i.checkPut = e(o.put), i.revertClone = o.revertClone, t.group = i;
}, uo = function() {
  !so && w && y(w, "display", "none");
}, ho = function() {
  !so && w && y(w, "display", "");
};
Se && !Zi && document.addEventListener("click", function(a) {
  if (he)
    return a.preventDefault(), a.stopPropagation && a.stopPropagation(), a.stopImmediatePropagation && a.stopImmediatePropagation(), he = !1, !1;
}, !0);
var _t = function(t) {
  if (_) {
    t = t.touches ? t.touches[0] : t;
    var e = hn(t.clientX, t.clientY);
    if (e) {
      var i = {};
      for (var o in t)
        t.hasOwnProperty(o) && (i[o] = t[o]);
      i.target = i.rootEl = e, i.preventDefault = void 0, i.stopPropagation = void 0, e[K]._onDragOver(i);
    }
  }
}, pn = function(t) {
  _ && _.parentNode[K]._isOutsideThisEl(t.target);
};
function b(a, t) {
  if (!(a && a.nodeType && a.nodeType === 1))
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(a));
  this.el = a, this.options = t = tt({}, t), a[K] = this;
  var e = {
    group: null,
    sort: !0,
    disabled: !1,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(a.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    // percentage; 0 <= x <= 1
    invertSwap: !1,
    // invert always
    invertedSwapThreshold: null,
    // will be set to same as swapThreshold if default
    removeCloneOnHide: !0,
    direction: function() {
      return co(a, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: !0,
    animation: 0,
    easing: null,
    setData: function(r, s) {
      r.setData("Text", s.textContent);
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
    supportPointer: b.supportPointer !== !1 && "PointerEvent" in window && (!Kt || ii),
    emptyInsertThreshold: 5
  };
  Jt.initializePlugins(this, a, e);
  for (var i in e)
    !(i in t) && (t[i] = e[i]);
  lo(t);
  for (var o in this)
    o.charAt(0) === "_" && typeof this[o] == "function" && (this[o] = this[o].bind(this));
  this.nativeDraggable = t.forceFallback ? !1 : dn, this.nativeDraggable && (this.options.touchStartThreshold = 1), t.supportPointer ? E(a, "pointerdown", this._onTapStart) : (E(a, "mousedown", this._onTapStart), E(a, "touchstart", this._onTapStart)), this.nativeDraggable && (E(a, "dragover", this), E(a, "dragenter", this)), pe.push(this.el), t.store && t.store.get && this.sort(t.store.get(this) || []), tt(this, an());
}
b.prototype = /** @lends Sortable.prototype */
{
  constructor: b,
  _isOutsideThisEl: function(t) {
    !this.el.contains(t) && t !== this.el && (Et = null);
  },
  _getDirection: function(t, e) {
    return typeof this.options.direction == "function" ? this.options.direction.call(this, t, e, _) : this.options.direction;
  },
  _onTapStart: function(t) {
    if (t.cancelable) {
      var e = this, i = this.el, o = this.options, n = o.preventOnFilter, r = t.type, s = t.touches && t.touches[0] || t.pointerType && t.pointerType === "touch" && t, c = (s || t).target, d = t.target.shadowRoot && (t.path && t.path[0] || t.composedPath && t.composedPath()[0]) || c, u = o.filter;
      if (wn(i), !_ && !(/mousedown|pointerdown/.test(r) && t.button !== 0 || o.disabled) && !d.isContentEditable && !(!this.nativeDraggable && Kt && c && c.tagName.toUpperCase() === "SELECT") && (c = V(c, o.draggable, i, !1), !(c && c.animated) && re !== c)) {
        if (kt = W(c), Ht = W(c, o.draggable), typeof u == "function") {
          if (u.call(this, t, c, this)) {
            z({
              sortable: e,
              rootEl: d,
              name: "filter",
              targetEl: c,
              toEl: i,
              fromEl: i
            }), U("filter", e, {
              evt: t
            }), n && t.preventDefault();
            return;
          }
        } else if (u && (u = u.split(",").some(function(l) {
          if (l = V(d, l.trim(), i, !1), l)
            return z({
              sortable: e,
              rootEl: l,
              name: "filter",
              targetEl: c,
              fromEl: i,
              toEl: i
            }), U("filter", e, {
              evt: t
            }), !0;
        }), u)) {
          n && t.preventDefault();
          return;
        }
        o.handle && !V(d, o.handle, i, !1) || this._prepareDragStart(t, s, c);
      }
    }
  },
  _prepareDragStart: function(t, e, i) {
    var o = this, n = o.el, r = o.options, s = n.ownerDocument, c;
    if (i && !_ && i.parentNode === n) {
      var d = L(i);
      if (D = n, _ = i, C = _.parentNode, vt = _.nextSibling, re = i, te = r.group, b.dragged = _, gt = {
        target: _,
        clientX: (e || t).clientX,
        clientY: (e || t).clientY
      }, $i = gt.clientX - d.left, Ai = gt.clientY - d.top, this._lastX = (e || t).clientX, this._lastY = (e || t).clientY, _.style["will-change"] = "all", c = function() {
        if (U("delayEnded", o, {
          evt: t
        }), b.eventCanceled) {
          o._onDrop();
          return;
        }
        o._disableDelayedDragEvents(), !wi && o.nativeDraggable && (_.draggable = !0), o._triggerDragStart(t, e), z({
          sortable: o,
          name: "choose",
          originalEvent: t
        }), q(_, r.chosenClass, !0);
      }, r.ignore.split(",").forEach(function(u) {
        io(_, u.trim(), Re);
      }), E(s, "dragover", _t), E(s, "mousemove", _t), E(s, "touchmove", _t), r.supportPointer ? (E(s, "pointerup", o._onDrop), !this.nativeDraggable && E(s, "pointercancel", o._onDrop)) : (E(s, "mouseup", o._onDrop), E(s, "touchend", o._onDrop), E(s, "touchcancel", o._onDrop)), wi && this.nativeDraggable && (this.options.touchStartThreshold = 4, _.draggable = !0), U("delayStart", this, {
        evt: t
      }), r.delay && (!r.delayOnTouchOnly || e) && (!this.nativeDraggable || !(Qt || et))) {
        if (b.eventCanceled) {
          this._onDrop();
          return;
        }
        r.supportPointer ? (E(s, "pointerup", o._disableDelayedDrag), E(s, "pointercancel", o._disableDelayedDrag)) : (E(s, "mouseup", o._disableDelayedDrag), E(s, "touchend", o._disableDelayedDrag), E(s, "touchcancel", o._disableDelayedDrag)), E(s, "mousemove", o._delayedDragTouchMoveHandler), E(s, "touchmove", o._delayedDragTouchMoveHandler), r.supportPointer && E(s, "pointermove", o._delayedDragTouchMoveHandler), o._dragStartTimer = setTimeout(c, r.delay);
      } else
        c();
    }
  },
  _delayedDragTouchMoveHandler: function(t) {
    var e = t.touches ? t.touches[0] : t;
    Math.max(Math.abs(e.clientX - this._lastX), Math.abs(e.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1)) && this._disableDelayedDrag();
  },
  _disableDelayedDrag: function() {
    _ && Re(_), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function() {
    var t = this.el.ownerDocument;
    S(t, "mouseup", this._disableDelayedDrag), S(t, "touchend", this._disableDelayedDrag), S(t, "touchcancel", this._disableDelayedDrag), S(t, "pointerup", this._disableDelayedDrag), S(t, "pointercancel", this._disableDelayedDrag), S(t, "mousemove", this._delayedDragTouchMoveHandler), S(t, "touchmove", this._delayedDragTouchMoveHandler), S(t, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function(t, e) {
    e = e || t.pointerType == "touch" && t, !this.nativeDraggable || e ? this.options.supportPointer ? E(document, "pointermove", this._onTouchMove) : e ? E(document, "touchmove", this._onTouchMove) : E(document, "mousemove", this._onTouchMove) : (E(_, "dragend", this), E(D, "dragstart", this._onDragStart));
    try {
      document.selection ? ce(function() {
        document.selection.empty();
      }) : window.getSelection().removeAllRanges();
    } catch {
    }
  },
  _dragStarted: function(t, e) {
    if (At = !1, D && _) {
      U("dragStarted", this, {
        evt: e
      }), this.nativeDraggable && E(document, "dragover", pn);
      var i = this.options;
      !t && q(_, i.dragClass, !1), q(_, i.ghostClass, !0), b.active = this, t && this._appendGhost(), z({
        sortable: this,
        name: "start",
        originalEvent: e
      });
    } else
      this._nulling();
  },
  _emulateDragOver: function() {
    if (j) {
      this._lastX = j.clientX, this._lastY = j.clientY, uo();
      for (var t = document.elementFromPoint(j.clientX, j.clientY), e = t; t && t.shadowRoot && (t = t.shadowRoot.elementFromPoint(j.clientX, j.clientY), t !== e); )
        e = t;
      if (_.parentNode[K]._isOutsideThisEl(t), e)
        do {
          if (e[K]) {
            var i = void 0;
            if (i = e[K]._onDragOver({
              clientX: j.clientX,
              clientY: j.clientY,
              target: t,
              rootEl: e
            }), i && !this.options.dragoverBubble)
              break;
          }
          t = e;
        } while (e = eo(e));
      ho();
    }
  },
  _onTouchMove: function(t) {
    if (gt) {
      var e = this.options, i = e.fallbackTolerance, o = e.fallbackOffset, n = t.touches ? t.touches[0] : t, r = w && Dt(w, !0), s = w && r && r.a, c = w && r && r.d, d = ie && N && Ei(N), u = (n.clientX - gt.clientX + o.x) / (s || 1) + (d ? d[0] - Pe[0] : 0) / (s || 1), l = (n.clientY - gt.clientY + o.y) / (c || 1) + (d ? d[1] - Pe[1] : 0) / (c || 1);
      if (!b.active && !At) {
        if (i && Math.max(Math.abs(n.clientX - this._lastX), Math.abs(n.clientY - this._lastY)) < i)
          return;
        this._onDragStart(t, !0);
      }
      if (w) {
        r ? (r.e += u - (Ie || 0), r.f += l - (Le || 0)) : r = {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: u,
          f: l
        };
        var h = "matrix(".concat(r.a, ",").concat(r.b, ",").concat(r.c, ",").concat(r.d, ",").concat(r.e, ",").concat(r.f, ")");
        y(w, "webkitTransform", h), y(w, "mozTransform", h), y(w, "msTransform", h), y(w, "transform", h), Ie = u, Le = l, j = n;
      }
      t.cancelable && t.preventDefault();
    }
  },
  _appendGhost: function() {
    if (!w) {
      var t = this.options.fallbackOnBody ? document.body : D, e = L(_, !0, ie, !0, t), i = this.options;
      if (ie) {
        for (N = t; y(N, "position") === "static" && y(N, "transform") === "none" && N !== document; )
          N = N.parentNode;
        N !== document.body && N !== document.documentElement ? (N === document && (N = X()), e.top += N.scrollTop, e.left += N.scrollLeft) : N = X(), Pe = Ei(N);
      }
      w = _.cloneNode(!0), q(w, i.ghostClass, !1), q(w, i.fallbackClass, !0), q(w, i.dragClass, !0), y(w, "transition", ""), y(w, "transform", ""), y(w, "box-sizing", "border-box"), y(w, "margin", 0), y(w, "top", e.top), y(w, "left", e.left), y(w, "width", e.width), y(w, "height", e.height), y(w, "opacity", "0.8"), y(w, "position", ie ? "absolute" : "fixed"), y(w, "zIndex", "100000"), y(w, "pointerEvents", "none"), b.ghost = w, t.appendChild(w), y(w, "transform-origin", $i / parseInt(w.style.width) * 100 + "% " + Ai / parseInt(w.style.height) * 100 + "%");
    }
  },
  _onDragStart: function(t, e) {
    var i = this, o = t.dataTransfer, n = i.options;
    if (U("dragStart", this, {
      evt: t
    }), b.eventCanceled) {
      this._onDrop();
      return;
    }
    U("setupClone", this), b.eventCanceled || (T = ao(_), T.removeAttribute("id"), T.draggable = !1, T.style["will-change"] = "", this._hideClone(), q(T, this.options.chosenClass, !1), b.clone = T), i.cloneId = ce(function() {
      U("clone", i), !b.eventCanceled && (i.options.removeCloneOnHide || D.insertBefore(T, _), i._hideClone(), z({
        sortable: i,
        name: "clone"
      }));
    }), !e && q(_, n.dragClass, !0), e ? (he = !0, i._loopId = setInterval(i._emulateDragOver, 50)) : (S(document, "mouseup", i._onDrop), S(document, "touchend", i._onDrop), S(document, "touchcancel", i._onDrop), o && (o.effectAllowed = "move", n.setData && n.setData.call(i, o, _)), E(document, "drop", i), y(_, "transform", "translateZ(0)")), At = !0, i._dragStartId = ce(i._dragStarted.bind(i, e, t)), E(document, "selectstart", i), Nt = !0, window.getSelection().removeAllRanges(), Kt && y(document.body, "user-select", "none");
  },
  // Returns true - if no further action is needed (either inserted or another condition)
  _onDragOver: function(t) {
    var e = this.el, i = t.target, o, n, r, s = this.options, c = s.group, d = b.active, u = te === c, l = s.sort, h = R || d, f, p = this, g = !1;
    if (We) return;
    function v(Rt, bo) {
      U(Rt, p, Q({
        evt: t,
        isOwner: u,
        axis: f ? "vertical" : "horizontal",
        revert: r,
        dragRect: o,
        targetRect: n,
        canSort: l,
        fromSortable: h,
        target: i,
        completed: A,
        onMove: function(si, wo) {
          return oe(D, e, _, o, si, L(si), t, wo);
        },
        changed: k
      }, bo));
    }
    function $() {
      v("dragOverAnimationCapture"), p.captureAnimationState(), p !== h && h.captureAnimationState();
    }
    function A(Rt) {
      return v("dragOverCompleted", {
        insertion: Rt
      }), Rt && (u ? d._hideClone() : d._showClone(p), p !== h && (q(_, R ? R.options.ghostClass : d.options.ghostClass, !1), q(_, s.ghostClass, !0)), R !== p && p !== b.active ? R = p : p === b.active && R && (R = null), h === p && (p._ignoreWhileAnimating = i), p.animateAll(function() {
        v("dragOverAnimationComplete"), p._ignoreWhileAnimating = null;
      }), p !== h && (h.animateAll(), h._ignoreWhileAnimating = null)), (i === _ && !_.animated || i === e && !i.animated) && (Et = null), !s.dragoverBubble && !t.rootEl && i !== document && (_.parentNode[K]._isOutsideThisEl(t.target), !Rt && _t(t)), !s.dragoverBubble && t.stopPropagation && t.stopPropagation(), g = !0;
    }
    function k() {
      H = W(_), nt = W(_, s.draggable), z({
        sortable: p,
        name: "change",
        toEl: e,
        newIndex: H,
        newDraggableIndex: nt,
        originalEvent: t
      });
    }
    if (t.preventDefault !== void 0 && t.cancelable && t.preventDefault(), i = V(i, s.draggable, e, !0), v("dragOver"), b.eventCanceled) return g;
    if (_.contains(t.target) || i.animated && i.animatingX && i.animatingY || p._ignoreWhileAnimating === i)
      return A(!1);
    if (he = !1, d && !s.disabled && (u ? l || (r = C !== D) : R === this || (this.lastPutMode = te.checkPull(this, d, _, t)) && c.checkPut(this, d, _, t))) {
      if (f = this._getDirection(t, i) === "vertical", o = L(_), v("dragOverValid"), b.eventCanceled) return g;
      if (r)
        return C = D, $(), this._hideClone(), v("revert"), b.eventCanceled || (vt ? D.insertBefore(_, vt) : D.appendChild(_)), A(!0);
      var x = oi(e, s.draggable);
      if (!x || mn(t, f, this) && !x.animated) {
        if (x === _)
          return A(!1);
        if (x && e === t.target && (i = x), i && (n = L(i)), oe(D, e, _, o, i, n, t, !!i) !== !1)
          return $(), x && x.nextSibling ? e.insertBefore(_, x.nextSibling) : e.appendChild(_), C = e, k(), A(!0);
      } else if (x && _n(t, f, this)) {
        var B = Ct(e, 0, s, !0);
        if (B === _)
          return A(!1);
        if (i = B, n = L(i), oe(D, e, _, o, i, n, t, !1) !== !1)
          return $(), e.insertBefore(_, B), C = e, k(), A(!0);
      } else if (i.parentNode === e) {
        n = L(i);
        var F = 0, O, Y = _.parentNode !== e, M = !un(_.animated && _.toRect || o, i.animated && i.toRect || n, f), ut = f ? "top" : "left", it = Si(i, "top", "top") || Si(_, "top", "top"), Lt = it ? it.scrollTop : void 0;
        Et !== i && (O = n[ut], jt = !1, ee = !M && s.invertSwap || Y), F = vn(t, i, n, f, M ? 1 : s.swapThreshold, s.invertedSwapThreshold == null ? s.swapThreshold : s.invertedSwapThreshold, ee, Et === i);
        var J;
        if (F !== 0) {
          var ht = W(_);
          do
            ht -= F, J = C.children[ht];
          while (J && (y(J, "display") === "none" || J === w));
        }
        if (F === 0 || J === i)
          return A(!1);
        Et = i, Wt = F;
        var Pt = i.nextElementSibling, ot = !1;
        ot = F === 1;
        var Zt = oe(D, e, _, o, i, n, t, ot);
        if (Zt !== !1)
          return (Zt === 1 || Zt === -1) && (ot = Zt === 1), We = !0, setTimeout(gn, 30), $(), ot && !Pt ? e.appendChild(_) : i.parentNode.insertBefore(_, ot ? Pt : i), it && no(it, 0, Lt - it.scrollTop), C = _.parentNode, O !== void 0 && !ee && (se = Math.abs(O - L(i)[ut])), k(), A(!0);
      }
      if (e.contains(_))
        return A(!1);
    }
    return !1;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function() {
    S(document, "mousemove", this._onTouchMove), S(document, "touchmove", this._onTouchMove), S(document, "pointermove", this._onTouchMove), S(document, "dragover", _t), S(document, "mousemove", _t), S(document, "touchmove", _t);
  },
  _offUpEvents: function() {
    var t = this.el.ownerDocument;
    S(t, "mouseup", this._onDrop), S(t, "touchend", this._onDrop), S(t, "pointerup", this._onDrop), S(t, "pointercancel", this._onDrop), S(t, "touchcancel", this._onDrop), S(document, "selectstart", this);
  },
  _onDrop: function(t) {
    var e = this.el, i = this.options;
    if (H = W(_), nt = W(_, i.draggable), U("drop", this, {
      evt: t
    }), C = _ && _.parentNode, H = W(_), nt = W(_, i.draggable), b.eventCanceled) {
      this._nulling();
      return;
    }
    At = !1, ee = !1, jt = !1, clearInterval(this._loopId), clearTimeout(this._dragStartTimer), je(this.cloneId), je(this._dragStartId), this.nativeDraggable && (S(document, "drop", this), S(e, "dragstart", this._onDragStart)), this._offMoveEvents(), this._offUpEvents(), Kt && y(document.body, "user-select", ""), y(_, "transform", ""), t && (Nt && (t.cancelable && t.preventDefault(), !i.dropBubble && t.stopPropagation()), w && w.parentNode && w.parentNode.removeChild(w), (D === C || R && R.lastPutMode !== "clone") && T && T.parentNode && T.parentNode.removeChild(T), _ && (this.nativeDraggable && S(_, "dragend", this), Re(_), _.style["will-change"] = "", Nt && !At && q(_, R ? R.options.ghostClass : this.options.ghostClass, !1), q(_, this.options.chosenClass, !1), z({
      sortable: this,
      name: "unchoose",
      toEl: C,
      newIndex: null,
      newDraggableIndex: null,
      originalEvent: t
    }), D !== C ? (H >= 0 && (z({
      rootEl: C,
      name: "add",
      toEl: C,
      fromEl: D,
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
      fromEl: D,
      originalEvent: t
    }), z({
      sortable: this,
      name: "sort",
      toEl: C,
      originalEvent: t
    })), R && R.save()) : H !== kt && H >= 0 && (z({
      sortable: this,
      name: "update",
      toEl: C,
      originalEvent: t
    }), z({
      sortable: this,
      name: "sort",
      toEl: C,
      originalEvent: t
    })), b.active && ((H == null || H === -1) && (H = kt, nt = Ht), z({
      sortable: this,
      name: "end",
      toEl: C,
      originalEvent: t
    }), this.save()))), this._nulling();
  },
  _nulling: function() {
    U("nulling", this), D = _ = C = w = vt = T = re = rt = gt = j = Nt = H = nt = kt = Ht = Et = Wt = R = te = b.dragged = b.ghost = b.clone = b.active = null, fe.forEach(function(t) {
      t.checked = !0;
    }), fe.length = Ie = Le = 0;
  },
  handleEvent: function(t) {
    switch (t.type) {
      case "drop":
      case "dragend":
        this._onDrop(t);
        break;
      case "dragenter":
      case "dragover":
        _ && (this._onDragOver(t), fn(t));
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
    for (var t = [], e, i = this.el.children, o = 0, n = i.length, r = this.options; o < n; o++)
      e = i[o], V(e, r.draggable, this.el, !1) && t.push(e.getAttribute(r.dataIdAttr) || bn(e));
    return t;
  },
  /**
   * Sorts the elements according to the array.
   * @param  {String[]}  order  order of the items
   */
  sort: function(t, e) {
    var i = {}, o = this.el;
    this.toArray().forEach(function(n, r) {
      var s = o.children[r];
      V(s, this.options.draggable, o, !1) && (i[n] = s);
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
    return V(t, e || this.options.draggable, this.el, !1);
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
    typeof o < "u" ? i[t] = o : i[t] = e, t === "group" && lo(i);
  },
  /**
   * Destroy
   */
  destroy: function() {
    U("destroy", this);
    var t = this.el;
    t[K] = null, S(t, "mousedown", this._onTapStart), S(t, "touchstart", this._onTapStart), S(t, "pointerdown", this._onTapStart), this.nativeDraggable && (S(t, "dragover", this), S(t, "dragenter", this)), Array.prototype.forEach.call(t.querySelectorAll("[draggable]"), function(e) {
      e.removeAttribute("draggable");
    }), this._onDrop(), this._disableDelayedDragEvents(), pe.splice(pe.indexOf(this.el), 1), this.el = t = null;
  },
  _hideClone: function() {
    if (!rt) {
      if (U("hideClone", this), b.eventCanceled) return;
      y(T, "display", "none"), this.options.removeCloneOnHide && T.parentNode && T.parentNode.removeChild(T), rt = !0;
    }
  },
  _showClone: function(t) {
    if (t.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (rt) {
      if (U("showClone", this), b.eventCanceled) return;
      _.parentNode == D && !this.options.group.revertClone ? D.insertBefore(T, _) : vt ? D.insertBefore(T, vt) : D.appendChild(T), this.options.group.revertClone && this.animate(_, T), y(T, "display", ""), rt = !1;
    }
  }
};
function fn(a) {
  a.dataTransfer && (a.dataTransfer.dropEffect = "move"), a.cancelable && a.preventDefault();
}
function oe(a, t, e, i, o, n, r, s) {
  var c, d = a[K], u = d.options.onMove, l;
  return window.CustomEvent && !et && !Qt ? c = new CustomEvent("move", {
    bubbles: !0,
    cancelable: !0
  }) : (c = document.createEvent("Event"), c.initEvent("move", !0, !0)), c.to = t, c.from = a, c.dragged = e, c.draggedRect = i, c.related = o || t, c.relatedRect = n || L(t), c.willInsertAfter = s, c.originalEvent = r, a.dispatchEvent(c), u && (l = u.call(d, c, r)), l;
}
function Re(a) {
  a.draggable = !1;
}
function gn() {
  We = !1;
}
function _n(a, t, e) {
  var i = L(Ct(e.el, 0, e.options, !0)), o = ro(e.el, e.options, w), n = 10;
  return t ? a.clientX < o.left - n || a.clientY < i.top && a.clientX < i.right : a.clientY < o.top - n || a.clientY < i.bottom && a.clientX < i.left;
}
function mn(a, t, e) {
  var i = L(oi(e.el, e.options.draggable)), o = ro(e.el, e.options, w), n = 10;
  return t ? a.clientX > o.right + n || a.clientY > i.bottom && a.clientX > i.left : a.clientY > o.bottom + n || a.clientX > i.right && a.clientY > i.top;
}
function vn(a, t, e, i, o, n, r, s) {
  var c = i ? a.clientY : a.clientX, d = i ? e.height : e.width, u = i ? e.top : e.left, l = i ? e.bottom : e.right, h = !1;
  if (!r) {
    if (s && se < d * o) {
      if (!jt && (Wt === 1 ? c > u + d * n / 2 : c < l - d * n / 2) && (jt = !0), jt)
        h = !0;
      else if (Wt === 1 ? c < u + se : c > l - se)
        return -Wt;
    } else if (c > u + d * (1 - o) / 2 && c < l - d * (1 - o) / 2)
      return yn(t);
  }
  return h = h || r, h && (c < u + d * n / 2 || c > l - d * n / 2) ? c > u + d / 2 ? 1 : -1 : 0;
}
function yn(a) {
  return W(_) < W(a) ? 1 : -1;
}
function bn(a) {
  for (var t = a.tagName + a.className + a.src + a.href + a.textContent, e = t.length, i = 0; e--; )
    i += t.charCodeAt(e);
  return i.toString(36);
}
function wn(a) {
  fe.length = 0;
  for (var t = a.getElementsByTagName("input"), e = t.length; e--; ) {
    var i = t[e];
    i.checked && fe.push(i);
  }
}
function ce(a) {
  return setTimeout(a, 0);
}
function je(a) {
  return clearTimeout(a);
}
Se && E(document, "touchmove", function(a) {
  (b.active || At) && a.cancelable && a.preventDefault();
});
b.utils = {
  on: E,
  off: S,
  css: y,
  find: io,
  is: function(t, e) {
    return !!V(t, e, t, !1);
  },
  extend: on,
  throttle: oo,
  closest: V,
  toggleClass: q,
  clone: ao,
  index: W,
  nextTick: ce,
  cancelNextTick: je,
  detectDirection: co,
  getChild: Ct,
  expando: K
};
b.get = function(a) {
  return a[K];
};
b.mount = function() {
  for (var a = arguments.length, t = new Array(a), e = 0; e < a; e++)
    t[e] = arguments[e];
  t[0].constructor === Array && (t = t[0]), t.forEach(function(i) {
    if (!i.prototype || !i.prototype.constructor)
      throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(i));
    i.utils && (b.utils = Q(Q({}, b.utils), i.utils)), Jt.mount(i);
  });
};
b.create = function(a, t) {
  return new b(a, t);
};
b.version = tn;
var I = [], Bt, Ve, Ge = !1, Oe, Me, ge, Ft;
function xn() {
  function a() {
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
  return a.prototype = {
    dragStarted: function(e) {
      var i = e.originalEvent;
      this.sortable.nativeDraggable ? E(document, "dragover", this._handleAutoScroll) : this.options.supportPointer ? E(document, "pointermove", this._handleFallbackAutoScroll) : i.touches ? E(document, "touchmove", this._handleFallbackAutoScroll) : E(document, "mousemove", this._handleFallbackAutoScroll);
    },
    dragOverCompleted: function(e) {
      var i = e.originalEvent;
      !this.options.dragOverBubble && !i.rootEl && this._handleAutoScroll(i);
    },
    drop: function() {
      this.sortable.nativeDraggable ? S(document, "dragover", this._handleAutoScroll) : (S(document, "pointermove", this._handleFallbackAutoScroll), S(document, "touchmove", this._handleFallbackAutoScroll), S(document, "mousemove", this._handleFallbackAutoScroll)), Di(), le(), nn();
    },
    nulling: function() {
      ge = Ve = Bt = Ge = Ft = Oe = Me = null, I.length = 0;
    },
    _handleFallbackAutoScroll: function(e) {
      this._handleAutoScroll(e, !0);
    },
    _handleAutoScroll: function(e, i) {
      var o = this, n = (e.touches ? e.touches[0] : e).clientX, r = (e.touches ? e.touches[0] : e).clientY, s = document.elementFromPoint(n, r);
      if (ge = e, i || this.options.forceAutoScrollFallback || Qt || et || Kt) {
        Ne(e, this.options, s, i);
        var c = ct(s, !0);
        Ge && (!Ft || n !== Oe || r !== Me) && (Ft && Di(), Ft = setInterval(function() {
          var d = ct(document.elementFromPoint(n, r), !0);
          d !== c && (c = d, le()), Ne(e, o.options, d, i);
        }, 10), Oe = n, Me = r);
      } else {
        if (!this.options.bubbleScroll || ct(s, !0) === X()) {
          le();
          return;
        }
        Ne(e, this.options, ct(s, !1), !1);
      }
    }
  }, tt(a, {
    pluginName: "scroll",
    initializeByDefault: !0
  });
}
function le() {
  I.forEach(function(a) {
    clearInterval(a.pid);
  }), I = [];
}
function Di() {
  clearInterval(Ft);
}
var Ne = oo(function(a, t, e, i) {
  if (t.scroll) {
    var o = (a.touches ? a.touches[0] : a).clientX, n = (a.touches ? a.touches[0] : a).clientY, r = t.scrollSensitivity, s = t.scrollSpeed, c = X(), d = !1, u;
    Ve !== e && (Ve = e, le(), Bt = t.scroll, u = t.scrollFn, Bt === !0 && (Bt = ct(e, !0)));
    var l = 0, h = Bt;
    do {
      var f = h, p = L(f), g = p.top, v = p.bottom, $ = p.left, A = p.right, k = p.width, x = p.height, B = void 0, F = void 0, O = f.scrollWidth, Y = f.scrollHeight, M = y(f), ut = f.scrollLeft, it = f.scrollTop;
      f === c ? (B = k < O && (M.overflowX === "auto" || M.overflowX === "scroll" || M.overflowX === "visible"), F = x < Y && (M.overflowY === "auto" || M.overflowY === "scroll" || M.overflowY === "visible")) : (B = k < O && (M.overflowX === "auto" || M.overflowX === "scroll"), F = x < Y && (M.overflowY === "auto" || M.overflowY === "scroll"));
      var Lt = B && (Math.abs(A - o) <= r && ut + k < O) - (Math.abs($ - o) <= r && !!ut), J = F && (Math.abs(v - n) <= r && it + x < Y) - (Math.abs(g - n) <= r && !!it);
      if (!I[l])
        for (var ht = 0; ht <= l; ht++)
          I[ht] || (I[ht] = {});
      (I[l].vx != Lt || I[l].vy != J || I[l].el !== f) && (I[l].el = f, I[l].vx = Lt, I[l].vy = J, clearInterval(I[l].pid), (Lt != 0 || J != 0) && (d = !0, I[l].pid = setInterval((function() {
        i && this.layer === 0 && b.active._onTouchMove(ge);
        var Pt = I[this.layer].vy ? I[this.layer].vy * s : 0, ot = I[this.layer].vx ? I[this.layer].vx * s : 0;
        typeof u == "function" && u.call(b.dragged.parentNode[K], ot, Pt, a, ge, I[this.layer].el) !== "continue" || no(I[this.layer].el, ot, Pt);
      }).bind({
        layer: l
      }), 24))), l++;
    } while (t.bubbleScroll && h !== c && (h = ct(h, !1)));
    Ge = d;
  }
}, 30), po = function(t) {
  var e = t.originalEvent, i = t.putSortable, o = t.dragEl, n = t.activeSortable, r = t.dispatchSortableEvent, s = t.hideGhostForTarget, c = t.unhideGhostForTarget;
  if (e) {
    var d = i || n;
    s();
    var u = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e, l = document.elementFromPoint(u.clientX, u.clientY);
    c(), d && !d.el.contains(l) && (r("spill"), this.onSpill({
      dragEl: o,
      putSortable: i
    }));
  }
};
function ni() {
}
ni.prototype = {
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
  drop: po
};
tt(ni, {
  pluginName: "revertOnSpill"
});
function ai() {
}
ai.prototype = {
  onSpill: function(t) {
    var e = t.dragEl, i = t.putSortable, o = i || this.sortable;
    o.captureAnimationState(), e.parentNode && e.parentNode.removeChild(e), o.animateAll();
  },
  drop: po
};
tt(ai, {
  pluginName: "removeOnSpill"
});
b.mount(new xn());
b.mount(ai, ni);
function Sn(a) {
  const t = a.toLowerCase(), e = {
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
    if (n.some((r) => t.includes(r)))
      return i[o] ?? null;
  return null;
}
function fo(a) {
  return {
    floor: "mdi:layers",
    area: "mdi:map-marker",
    building: "mdi:office-building",
    grounds: "mdi:pine-tree",
    subarea: "mdi:map-marker-radius"
  }[a] ?? "mdi:map-marker";
}
function En(a) {
  const t = String(a ?? "area").trim().toLowerCase();
  return t === "room" ? "area" : t === "floor" ? "floor" : t === "area" ? "area" : t === "building" ? "building" : t === "grounds" ? "grounds" : t === "subarea" ? "subarea" : "area";
}
function $n(a) {
  var o;
  const t = (o = a.modules) == null ? void 0 : o._meta;
  if (t != null && t.icon) return String(t.icon);
  const e = Sn(a.name);
  if (e) return e;
  const i = En(t == null ? void 0 : t.type);
  return fo(i);
}
const An = 24;
function kn(a, t) {
  const e = /* @__PURE__ */ new Set([t]);
  let i = !0;
  for (; i; ) {
    i = !1;
    for (const o of a) {
      const n = o.location.parent_id;
      n && e.has(n) && !e.has(o.location.id) && (e.add(o.location.id), i = !0);
    }
  }
  return e;
}
function Ti(a, t) {
  const e = new Map(a.map((l) => [l.id, l])), i = /* @__PURE__ */ new Map(), o = (l) => {
    const h = l.parent_id;
    return !h || h === l.id || !e.has(h) ? null : h;
  };
  for (const l of a) {
    const h = o(l);
    i.has(h) || i.set(h, []), i.get(h).push(l);
  }
  const n = [], r = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), d = [...i.get(null) || []];
  for (; d.length; ) {
    const l = d.pop();
    if (!s.has(l.id)) {
      s.add(l.id);
      for (const h of i.get(l.id) || [])
        d.push(h);
    }
  }
  function u(l, h) {
    const f = i.get(l) || [];
    for (const p of f) {
      if (r.has(p.id)) continue;
      r.add(p.id);
      const v = (i.get(p.id) || []).length > 0, $ = t.has(p.id);
      n.push({ location: p, depth: h, hasChildren: v, isExpanded: $ }), $ && v && u(p.id, h + 1);
    }
  }
  u(null, 0);
  for (const l of a) {
    if (s.has(l.id) || r.has(l.id)) continue;
    r.add(l.id);
    const f = (i.get(l.id) || []).length > 0, p = t.has(l.id);
    n.push({ location: l, depth: 0, hasChildren: f, isExpanded: p }), p && f && u(l.id, 1);
  }
  return n;
}
function Ci(a, t, e, i) {
  if (i) {
    const r = a.left;
    if (t >= r && t < r + An) return "outdent";
  }
  const o = e - a.top, n = a.height;
  return o < n * 0.25 ? "before" : o < n * 0.75 ? "inside" : "after";
}
function Dn(a, t, e, i, o) {
  const n = kn(a, t), r = a.filter((l) => !n.has(l.location.id)), s = r.find((l) => l.location.id === i);
  if (!s) return { parentId: e, siblingIndex: 0 };
  const c = o === "inside" ? i : s.location.parent_id, d = r.filter((l) => l.location.parent_id === c), u = d.findIndex((l) => l.location.id === i);
  return o === "inside" ? { parentId: i, siblingIndex: d.length } : o === "before" ? { parentId: c, siblingIndex: u >= 0 ? u : 0 } : o === "after" ? { parentId: c, siblingIndex: Math.min(u >= 0 ? u + 1 : d.length, d.length) } : { parentId: c, siblingIndex: u >= 0 ? u : 0 };
}
const Ii = "application/x-topomation-entity-id", me = class me extends dt {
  constructor() {
    super(...arguments), this.locations = [], this.version = 0, this.occupancyStates = {}, this.readOnly = !1, this.allowMove = !1, this.allowRename = !1, this._expandedIds = /* @__PURE__ */ new Set(), this._editingValue = "", this._isDragging = !1, this._hasInitializedExpansion = !1;
  }
  _resolveRelatedId(t) {
    var r;
    const e = ((r = t.dragged) == null ? void 0 : r.getAttribute("data-id")) || void 0, i = t.related;
    if (!e || !(i != null && i.classList.contains("tree-item"))) return;
    const o = i.getAttribute("data-id") || void 0;
    if (o && o !== e && !He(this.locations, e, o))
      return o;
    let n = i;
    for (; n; ) {
      if (n.classList.contains("tree-item")) {
        const s = n.getAttribute("data-id") || void 0;
        if (s && s !== e && !He(this.locations, e, s))
          return s;
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
      e && (this._sortable = b.create(e, {
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
          var s;
          const n = ((s = o.dragged) == null ? void 0 : s.getAttribute("data-id")) || void 0, r = o.related;
          if (n && (r != null && r.classList.contains("tree-item"))) {
            const c = this._resolveRelatedId(o) ?? r.getAttribute("data-id") ?? void 0;
            if (!c || c === n)
              return this._activeDropTarget = void 0, this._dropIndicator = void 0, !0;
            const d = r.getBoundingClientRect(), u = o.originalEvent, l = typeof (u == null ? void 0 : u.clientX) == "number" ? u.clientX : d.left + d.width / 2, h = typeof (u == null ? void 0 : u.clientY) == "number" ? u.clientY : d.top + d.height / 2, f = this.locations.find(($) => $.id === n), p = (f == null ? void 0 : f.parent_id) ?? null, v = Ci(d, l, h, c === p);
            this._activeDropTarget = { relatedId: c, zone: v }, this._updateDropIndicator(n, r, v);
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
    const o = this.locations.find((l) => l.id === i);
    if (!o) return;
    const n = this._activeDropTarget;
    if (!n) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    const r = Ti(this.locations, this._expandedIds), s = Dn(
      r,
      i,
      o.parent_id,
      n.relatedId,
      n.zone
    ), { parentId: c, siblingIndex: d } = s, u = r.filter((l) => l.location.parent_id === o.parent_id).findIndex((l) => l.location.id === i);
    if (c === o.parent_id && d === u) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    if (!Wo({ locations: this.locations, locationId: i, newParentId: c })) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }
    this.dispatchEvent(new CustomEvent("location-moved", {
      detail: { locationId: i, newParentId: c, newIndex: d },
      bubbles: !0,
      composed: !0
    }));
  }
  _handleContinuousDragOver(t) {
    var u, l;
    t.preventDefault();
    const e = this._draggedId;
    if (!e) return;
    const i = (l = (u = t.target) == null ? void 0 : u.closest) == null ? void 0 : l.call(u, ".tree-item");
    if (!i) return;
    const o = i.getAttribute("data-id");
    if (!o || o === e) return;
    const n = i.getBoundingClientRect(), r = this.locations.find((h) => h.id === e), s = (r == null ? void 0 : r.parent_id) ?? null, c = o === s, d = Ci(n, t.clientX, t.clientY, c);
    this._activeDropTarget = { relatedId: o, zone: d }, this._updateDropIndicator(e, i, d);
  }
  _restoreTreeAfterCancelledDrop() {
    this._dropIndicator = void 0, this.requestUpdate(), this.updateComplete.then(() => {
      this._cleanupDuplicateTreeItems(), this._initializeSortable();
    });
  }
  _updateDropIndicator(t, e, i) {
    var h;
    const o = (h = this.shadowRoot) == null ? void 0 : h.querySelector(".tree-list");
    if (!e || !o) {
      this._dropIndicator = void 0;
      return;
    }
    const n = o.getBoundingClientRect(), r = e.getBoundingClientRect(), s = i === "inside" ? "child" : i === "outdent" ? "outdent" : "sibling", c = i === "inside" ? "Child" : i === "outdent" ? "Outdent" : i === "after" ? "After" : "Before";
    let d = r.left - n.left + 6;
    i === "inside" && (d += 24), i === "outdent" && (d -= 24), d = Math.max(8, Math.min(d, n.width - 44));
    const u = Math.max(36, n.width - d - 8), l = i === "after" ? r.bottom - n.top : i === "before" ? r.top - n.top : i === "inside" ? r.bottom - n.top : r.top - n.top;
    this._dropIndicator = { top: l, left: d, width: u, intent: s, label: c };
  }
  _cleanupDuplicateTreeItems() {
    var o;
    const t = (o = this.shadowRoot) == null ? void 0 : o.querySelector(".tree-list");
    if (!t) return;
    const e = Array.from(t.querySelectorAll(".tree-item[data-id]")), i = /* @__PURE__ */ new Set();
    for (const n of e) {
      const r = n.getAttribute("data-id");
      if (r) {
        if (i.has(r)) {
          n.remove();
          continue;
        }
        i.add(r);
      }
    }
  }
  render() {
    if (!this.locations.length)
      return m`
        <div class="empty-state">
          <ha-icon icon="mdi:map-marker-plus" class="empty-state-icon"></ha-icon>
          <div class="empty-state-message">
            ${this.readOnly, "No locations yet. Create your first location to get started."}
          </div>
          ${this.readOnly ? m`
                <a
                  href="/config/areas"
                  class="button button-primary empty-state-cta"
                  @click=${this._handleOpenSettings}
                >
                  <ha-icon icon="mdi:cog"></ha-icon>
                  Open Settings → Areas & Floors
                </a>
              ` : m`<button class="button" @click=${this._handleCreate}>+ New Location</button>`}
        </div>
      `;
    const t = Ti(this.locations, this._expandedIds), e = this._computeOccupancyStatusByLocation(), i = this._computeLockStateByLocation();
    return m`
      <div class="tree-list">
        ${Xo(
      t,
      (o) => `${this.version}:${o.location.id}:${o.depth}`,
      (o) => this._renderItem(
        o,
        e[o.location.id] || "unknown",
        i[o.location.id] || { isLocked: !1, lockedBy: [] }
      )
    )}
        ${this._dropIndicator ? m`
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
    var k;
    const { location: o, depth: n, hasChildren: r, isExpanded: s } = t, c = this.selectedId === o.id, d = this._editingId === o.id, u = n * 24, l = xt(o), h = o.is_explicit_root ? "root" : l, f = o.is_explicit_root ? "home root" : l, p = i.isLocked ? "mdi:lock" : "mdi:lock-open-variant-outline", g = i.isLocked ? i.lockedBy.length ? `Locked (${i.lockedBy.join(", ")})` : "Locked" : "Unlocked", v = ((k = this.occupancyStates) == null ? void 0 : k[o.id]) === !0, $ = "mdi:home-switch-outline", A = v ? "Set vacant" : "Set occupied";
    return m`
      <div
        class="tree-item ${c ? "selected" : ""} ${l === "floor" ? "floor-item" : ""} ${this._entityDropTargetId === o.id ? "entity-drop-target" : ""}"
        data-id=${o.id}
        style="margin-left: ${u}px"
        @click=${(x) => this._handleClick(x, o)}
        @dragover=${(x) => this._handleEntityDragOver(x, o.id)}
        @dragleave=${(x) => this._handleEntityDragLeave(x, o.id)}
        @drop=${(x) => this._handleEntityDrop(x, o.id)}
      >
        <div
          class="drag-handle ${this.allowMove ? "" : "disabled"}"
          title=${this.allowMove ? "Drag to reorder. Drop on top/middle/bottom of a row for before/child/after." : "Hierarchy move is disabled."}
        ><ha-icon icon="mdi:drag-vertical"></ha-icon></div>

        <button
          class="expand-btn ${s ? "expanded" : ""} ${r ? "" : "hidden"}"
          @click=${(x) => this._handleExpand(x, o.id)}
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

        ${d ? m`<input class="location-name-input" .value=${this._editingValue}
                  @input=${(x) => this._editingValue = x.target.value}
                  @blur=${() => this._finishEditing(o.id)}
                  @keydown=${(x) => this._handleEditKeydown(x, o.id)}
                  @click=${(x) => x.stopPropagation()} />` : m`<div
              class="location-name"
              @dblclick=${this.allowRename ? (x) => this._startEditing(x, o) : () => {
    }}
            >${o.name}</div>`}

        <span class="type-badge ${h}">${f}</span>

        ${o.is_explicit_root || this.readOnly ? "" : m`
              <button
                class="occupancy-btn"
                title=${A}
                @click=${(x) => this._handleOccupancyToggle(x, o, v)}
              >
                <ha-icon .icon=${$}></ha-icon>
              </button>
              <button
                class="lock-btn ${i.isLocked ? "locked" : ""}"
                title=${g}
                @click=${(x) => this._handleLockToggle(x, o, i)}
              >
                <ha-icon .icon=${p}></ha-icon>
              </button>
            `}
      </div>
    `;
  }
  _getOccupancyStatusLabel(t) {
    return t === "occupied" ? "Occupied" : t === "vacant" ? "Vacant" : "Unknown occupancy";
  }
  _computeOccupancyStatusByLocation() {
    const t = {}, e = new Map(this.locations.map((r) => [r.id, r])), i = /* @__PURE__ */ new Map();
    for (const r of this.locations)
      r.parent_id && (i.has(r.parent_id) || i.set(r.parent_id, []), i.get(r.parent_id).push(r.id));
    const o = /* @__PURE__ */ new Map(), n = (r) => {
      var f;
      const s = o.get(r);
      if (s) return s;
      if (!e.has(r)) return "unknown";
      const c = (f = this.occupancyStates) == null ? void 0 : f[r], d = c === !0 ? "occupied" : c === !1 ? "vacant" : "unknown", u = i.get(r) || [];
      if (!u.length)
        return o.set(r, d), d;
      const l = u.map((p) => n(p));
      let h;
      return d === "occupied" || l.includes("occupied") ? h = "occupied" : d === "vacant" || l.length > 0 && l.every((p) => p === "vacant") ? h = "vacant" : h = "unknown", o.set(r, h), h;
    };
    for (const r of this.locations)
      t[r.id] = n(r.id);
    return t;
  }
  _computeLockStateByLocation() {
    var i;
    const t = ((i = this.hass) == null ? void 0 : i.states) || {}, e = {};
    for (const o of Object.values(t)) {
      const n = (o == null ? void 0 : o.attributes) || {};
      if (n.device_class !== "occupancy") continue;
      const r = n.location_id;
      if (!r) continue;
      const s = n.locked_by;
      e[String(r)] = {
        isLocked: !!n.is_locked,
        lockedBy: Array.isArray(s) ? s.map((c) => String(c)) : []
      };
    }
    return e;
  }
  _getIcon(t) {
    var i, o, n;
    if (t.ha_area_id && ((n = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[t.ha_area_id]) != null && n.icon))
      return this.hass.areas[t.ha_area_id].icon;
    const e = xt(t);
    return fo(e);
  }
  _hasEntityDragPayload(t) {
    var i;
    const e = Array.from(((i = t.dataTransfer) == null ? void 0 : i.types) || []);
    return e.includes(Ii) ? !0 : !this._isDragging && e.includes("text/plain");
  }
  _readEntityIdFromDrop(t) {
    var o, n;
    const e = (o = t.dataTransfer) == null ? void 0 : o.getData(Ii);
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
        const r = o.pop();
        if (!n.has(r)) {
          n.add(r);
          for (const s of this.locations)
            s.parent_id === r && (i.delete(s.id), o.push(s.id));
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
me.properties = {
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
}, me.styles = [
  xe,
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
let Ye = me;
customElements.get("ht-location-tree") || customElements.define("ht-location-tree", Ye);
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Tn = Xi(class extends Qi {
  constructor(a) {
    if (super(a), a.type !== mt.PROPERTY && a.type !== mt.ATTRIBUTE && a.type !== mt.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
    if (!Vo(a)) throw Error("`live` bindings can only contain a single expression");
  }
  render(a) {
    return a;
  }
  update(a, [t]) {
    if (t === G || t === P) return t;
    const e = a.element, i = a.name;
    if (a.type === mt.PROPERTY) {
      if (t === e[i]) return G;
    } else if (a.type === mt.BOOLEAN_ATTRIBUTE) {
      if (!!t === e.hasAttribute(i)) return G;
    } else if (a.type === mt.ATTRIBUTE && e.getAttribute(i) === t + "") return G;
    return Ji(a), t;
  }
}), st = 30 * 60, Li = 5 * 60;
function go(a) {
  if (!a) return "";
  const t = a.indexOf(".");
  return t >= 0 ? a.slice(0, t) : "";
}
function Cn(a) {
  return ["door", "garage_door", "opening", "window"].includes(a || "");
}
function In(a) {
  return ["presence", "occupancy"].includes(a || "");
}
function Ln(a) {
  return a === "motion";
}
function _o(a) {
  return a === "media_player";
}
function mo(a) {
  var i;
  const t = go(a == null ? void 0 : a.entity_id), e = (i = a == null ? void 0 : a.attributes) == null ? void 0 : i.device_class;
  if (_o(t))
    return {
      entity_id: (a == null ? void 0 : a.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: st,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "light" || t === "switch")
    return {
      entity_id: (a == null ? void 0 : a.entity_id) || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: st,
      off_event: "none",
      off_trailing: 0
    };
  if (t === "person" || t === "device_tracker")
    return {
      entity_id: (a == null ? void 0 : a.entity_id) || "",
      mode: "specific_states",
      on_event: "trigger",
      on_timeout: null,
      off_event: "clear",
      off_trailing: Li
    };
  if (t === "binary_sensor") {
    if (In(e))
      return {
        entity_id: (a == null ? void 0 : a.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: null,
        off_event: "clear",
        off_trailing: Li
      };
    if (Ln(e))
      return {
        entity_id: (a == null ? void 0 : a.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: st,
        off_event: "none",
        off_trailing: 0
      };
    if (Cn(e))
      return {
        entity_id: (a == null ? void 0 : a.entity_id) || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: st,
        off_event: "none",
        off_trailing: 0
      };
  }
  return {
    entity_id: (a == null ? void 0 : a.entity_id) || "",
    mode: "any_change",
    on_event: "trigger",
    on_timeout: st,
    off_event: "none",
    off_trailing: 0
  };
}
function Pn(a, t, e) {
  const i = go(e == null ? void 0 : e.entity_id), o = mo(e);
  if (_o(i)) {
    const r = a.on_timeout && a.on_timeout > 0 ? a.on_timeout : st;
    return {
      ...a,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: r,
      off_event: "none",
      off_trailing: 0
    };
  }
  if (t === "any_change") {
    const r = a.on_timeout ?? (o.mode === "any_change" ? o.on_timeout : st);
    return {
      ...a,
      mode: t,
      on_event: "trigger",
      on_timeout: r,
      off_event: "none",
      off_trailing: 0
    };
  }
  const n = o.mode === "specific_states" ? o : {
    ...o,
    on_event: "trigger",
    on_timeout: st,
    off_event: "none",
    off_trailing: 0
  };
  return {
    ...a,
    mode: t,
    on_event: a.on_event ?? n.on_event,
    on_timeout: a.on_timeout ?? n.on_timeout,
    off_event: a.off_event ?? n.off_event,
    off_trailing: a.off_trailing ?? n.off_trailing
  };
}
const vo = "topomation_", Be = "[topomation]", Rn = "topomation/actions/rules/list", On = "topomation/actions/rules/create", Mn = "topomation/actions/rules/delete";
function Nn(a) {
  if (!a || typeof a != "object") return;
  const t = a;
  if (typeof t.code == "string" && t.code.trim())
    return t.code.trim().toLowerCase();
  if (typeof t.error == "string" && t.error.trim())
    return t.error.trim().toLowerCase();
}
function ri(a) {
  const t = Nn(a);
  if (t && ["unknown_command", "not_found", "invalid_format", "unknown_error"].includes(t))
    return !0;
  const e = yo(a).toLowerCase();
  return e.includes("unknown_command") || e.includes("unknown command") || e.includes("unsupported") || e.includes("not loaded") || e.includes("not_loaded") || e.includes("invalid handler");
}
function _e(a) {
  return new Error(
    `Topomation managed-action backend is unavailable for ${a}. Reload Home Assistant to ensure this integration version is fully active.`
  );
}
function Bn(a) {
  if (typeof a != "string" || !a.includes(Be))
    return null;
  const t = a.split(/\r?\n/).map((e) => e.trim()).filter(Boolean);
  for (const e of t) {
    if (!e.startsWith(Be)) continue;
    const i = e.slice(Be.length).trim();
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
function Fn(a) {
  var s, c;
  const t = (a == null ? void 0 : a.actions) ?? (a == null ? void 0 : a.action), e = Array.isArray(t) ? t[0] : t;
  if (!e || typeof e != "object")
    return {};
  const i = typeof e.action == "string" ? e.action : "", o = i.includes(".") ? i.split(".").slice(1).join(".") : i, n = (s = e == null ? void 0 : e.target) == null ? void 0 : s.entity_id;
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
  const r = (c = e == null ? void 0 : e.data) == null ? void 0 : c.entity_id;
  return typeof r == "string" ? {
    action_entity_id: r,
    action_service: o || void 0
  } : {
    action_service: o || void 0
  };
}
function zn(a) {
  const t = (a == null ? void 0 : a.conditions) ?? (a == null ? void 0 : a.condition), e = Array.isArray(t) ? [...t] : t ? [t] : [];
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
async function Un(a) {
  try {
    const t = await a.callWS({ type: "config/entity_registry/list" });
    return Array.isArray(t) ? {
      entries: t.filter((e) => !e || typeof e.entity_id != "string" ? !1 : (typeof e.domain == "string" ? e.domain : String(e.entity_id).split(".", 1)[0]) === "automation"),
      usedStateFallback: !1
    } : {
      entries: [],
      usedStateFallback: !1
    };
  } catch (t) {
    return console.debug("[ha-automation-rules] entity_registry list unavailable; falling back to hass.states", t), {
      entries: Object.keys(a.states || {}).filter((e) => e.startsWith("automation.")).map((e) => ({ entity_id: e })),
      usedStateFallback: !0
    };
  }
}
function Kn(a, t) {
  const e = typeof (t == null ? void 0 : t.id) == "string" ? t.id.trim() : "";
  if (e) return e;
  const i = typeof a.unique_id == "string" ? a.unique_id.trim() : "";
  if (i) return i;
}
function qn(a) {
  return !!((typeof a.unique_id == "string" ? a.unique_id.trim().toLowerCase() : "").startsWith(vo) || (Array.isArray(a.labels) ? a.labels : []).some(
    (o) => typeof o == "string" && o.toLowerCase().includes("topomation")
  ) || Object.values(a.categories || {}).some(
    (o) => typeof o == "string" && o.toLowerCase().includes("topomation")
  ));
}
function Hn(a) {
  return Object.entries(a.states || {}).some(([t, e]) => {
    var o;
    if (!t.startsWith("automation.")) return !1;
    const i = (o = e == null ? void 0 : e.attributes) == null ? void 0 : o.id;
    return typeof i == "string" && i.trim().toLowerCase().startsWith(vo);
  });
}
function yo(a) {
  if (typeof a == "string" && a.trim()) return a.trim();
  if (a instanceof Error && a.message.trim()) return a.message.trim();
  if (a && typeof a == "object" && "message" in a) {
    const t = a.message;
    if (typeof t == "string" && t.trim())
      return t.trim();
  }
  return "unknown automation/config error";
}
async function Wn(a, t) {
  const i = (await Un(a)).entries, o = i.filter(qn), n = o.length > 0 ? o : i, r = [], c = (await Promise.all(
    n.map(async (l) => {
      var h, f;
      if (l.entity_id)
        try {
          const p = await a.callWS({
            type: "automation/config",
            entity_id: l.entity_id
          }), g = p == null ? void 0 : p.config;
          if (!g || typeof g != "object")
            return;
          const v = Bn(g.description);
          if (!v || v.location_id !== t)
            return;
          const $ = Kn(l, g), A = Fn(g), k = (h = a.states) == null ? void 0 : h[l.entity_id], x = k ? k.state !== "off" : !0, B = typeof g.alias == "string" && g.alias.trim() || ((f = k == null ? void 0 : k.attributes) == null ? void 0 : f.friendly_name) || l.entity_id;
          return {
            id: $ || l.entity_id,
            entity_id: l.entity_id,
            name: B,
            trigger_type: v.trigger_type,
            action_entity_id: A.action_entity_id,
            action_service: A.action_service,
            require_dark: typeof v.require_dark == "boolean" ? v.require_dark : zn(g),
            enabled: x
          };
        } catch (p) {
          r.push({
            entity_id: l.entity_id,
            error: p
          }), console.debug("[ha-automation-rules] failed to read automation config", l.entity_id, p);
          return;
        }
    })
  )).filter((l) => !!l).sort((l, h) => l.name.localeCompare(h.name)), d = n.length > 0 && r.length === n.length, u = o.length > 0 || Hn(a);
  if (c.length === 0 && d && u) {
    const l = r[0], h = l ? yo(l.error) : "unknown reason";
    throw new Error(`Unable to read Topomation automation configs: ${h}`);
  }
  return c;
}
async function jn(a, t, e) {
  try {
    const i = await a.callWS({
      type: Rn,
      location_id: t,
      ...e ? { entry_id: e } : {}
    });
    if (Array.isArray(i == null ? void 0 : i.rules))
      return [...i.rules].sort((o, n) => o.name.localeCompare(n.name));
  } catch (i) {
    if (!ri(i))
      throw i;
  }
  return Wn(a, t);
}
async function Vn(a, t, e) {
  try {
    const i = await a.callWS({
      type: On,
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
    throw ri(i) ? _e("rule creation") : i;
  }
  throw _e("rule creation");
}
async function Pi(a, t, e) {
  const i = typeof t == "string" ? t : t.id, o = typeof t == "string" ? void 0 : t.entity_id;
  try {
    const n = await a.callWS({
      type: Mn,
      automation_id: i,
      ...o ? { entity_id: o } : {},
      ...e ? { entry_id: e } : {}
    });
    if ((n == null ? void 0 : n.success) === !0)
      return;
  } catch (n) {
    throw ri(n) ? _e("rule deletion") : n;
  }
  throw _e("rule deletion");
}
var Ni, Bi;
try {
  (Bi = (Ni = import.meta) == null ? void 0 : Ni.hot) == null || Bi.accept(() => window.location.reload());
} catch {
}
const ve = class ve extends dt {
  constructor() {
    super(...arguments), this.entityRegistryRevision = 0, this.occupancyStates = {}, this._activeTab = "detection", this._savingSource = !1, this._externalAreaId = "", this._externalEntityId = "", this._entityAreaById = {}, this._entityRegistryMetaById = {}, this._actionRules = [], this._loadingActionRules = !1, this._liveOccupancyStateByLocation = {}, this._nowEpochMs = Date.now(), this._actionToggleBusy = {}, this._actionServiceSelections = {}, this._actionDarkSelections = {}, this._onTimeoutMemory = {}, this._actionRulesLoadSeq = 0, this._sourcePersistInFlight = !1, this._sourcePersistQueued = !1;
  }
  render() {
    return this.location ? m`
      <div class="inspector-container">
        ${this._renderHeader()} ${this._renderActionStartupConfig()} ${this._renderTabs()}
        ${this._renderContent()}
      </div>
    ` : m`
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
      o !== n && (this._resetSourceDraftState(), this._externalAreaId = "", this._externalEntityId = "", this._onTimeoutMemory = {}, this._actionToggleBusy = {}, this._actionServiceSelections = {}, this.hass && this._loadEntityAreaAssignments()), this._loadActionRules();
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
      const o = await jn(this.hass, e, this.entryId);
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
          for (const s of i) {
            const c = typeof (s == null ? void 0 : s.id) == "string" ? s.id : void 0, d = typeof (s == null ? void 0 : s.area_id) == "string" ? s.area_id : void 0;
            c && d && o.set(c, d);
          }
        const n = {}, r = {};
        if (Array.isArray(e))
          for (const s of e) {
            const c = typeof (s == null ? void 0 : s.entity_id) == "string" ? s.entity_id : void 0;
            if (!c) continue;
            const d = typeof (s == null ? void 0 : s.area_id) == "string" ? s.area_id : void 0, u = typeof (s == null ? void 0 : s.device_id) == "string" ? o.get(s.device_id) : void 0;
            n[c] = d || u || null, r[c] = {
              hiddenBy: typeof (s == null ? void 0 : s.hidden_by) == "string" ? s.hidden_by : null,
              disabledBy: typeof (s == null ? void 0 : s.disabled_by) == "string" ? s.disabled_by : null,
              entityCategory: typeof (s == null ? void 0 : s.entity_category) == "string" ? s.entity_category : null
            };
          }
        this._entityAreaById = n, this._entityRegistryMetaById = r;
      } catch {
        this._entityAreaById = {}, this._entityRegistryMetaById = {};
      } finally {
        this._entityAreaLoadPromise = void 0, this.requestUpdate();
      }
    })(), await this._entityAreaLoadPromise);
  }
  _renderHeader() {
    if (!this.location) return "";
    const t = this.location.ha_area_id, e = t ? "HA Area ID" : "Location ID", i = t || this.location.id, o = this._getLockState(), n = this._getOccupancyState(), r = this._resolveOccupiedState(n), s = r === !0, c = r === !0 ? "Occupied" : r === !1 ? "Vacant" : "Unknown", d = n ? this._resolveVacantAt(n.attributes || {}, s) : void 0, u = s ? d instanceof Date ? this._formatDateTime(d) : d === null ? "No timeout scheduled" : "Unknown" : void 0;
    return m`
      <div class="header">
        <div class="header-main">
          <div class="header-icon">
            <ha-icon .icon=${this._headerIcon(this.location)}></ha-icon>
          </div>
          <div class="header-content">
            <div class="location-name">${this.location.name}</div>
            <div class="header-status">
              <span
                class="status-chip ${s ? "occupied" : "vacant"}"
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
              ${s ? m`
                    <span class="header-vacant-at" data-testid="header-vacant-at">
                      Vacant at ${u}
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
    return e && ((n = (o = (i = this.hass) == null ? void 0 : i.areas) == null ? void 0 : o[e]) != null && n.icon) ? this.hass.areas[e].icon : $n(t);
  }
  _renderTabs() {
    return m`
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
    return m`
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
            var d, u, l, h;
            const o = (d = i == null ? void 0 : i.data) == null ? void 0 : d.entity_id, n = (u = i == null ? void 0 : i.data) == null ? void 0 : u.new_state, r = (l = i == null ? void 0 : i.data) == null ? void 0 : l.old_state, s = (n == null ? void 0 : n.attributes) || {}, c = (r == null ? void 0 : r.attributes) || {};
            if (typeof o == "string" && o.startsWith("binary_sensor.")) {
              const f = typeof s.location_id == "string" ? s.location_id : void 0, p = typeof c.location_id == "string" ? c.location_id : void 0, g = f || p, v = s.device_class === "occupancy", $ = c.device_class === "occupancy";
              if (g && (v || $)) {
                if (n && v)
                  this._liveOccupancyStateByLocation = {
                    ...this._liveOccupancyStateByLocation,
                    [g]: n
                  };
                else {
                  const { [g]: A, ...k } = this._liveOccupancyStateByLocation;
                  this._liveOccupancyStateByLocation = k;
                }
                ((h = this.location) == null ? void 0 : h.id) === g && this.requestUpdate();
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
    const t = this.location.modules.occupancy || {}, e = this._isFloorLocation(), i = !!this.location.ha_area_id, o = (t.occupancy_sources || []).length, n = this._getLockState();
    return e ? m`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:layers"}></ha-icon>
            Floor Occupancy Policy
          </div>
          <div class="policy-note">
            Occupancy sources are disabled for floor locations. Assign sensors to area locations, then
            use floor-level automation by aggregating those child areas.
          </div>
          ${o > 0 ? m`
                <div class="policy-warning">
                  This floor still has ${o} unsupported source${o === 1 ? "" : "s"} in
                  config. Floor sources are unsupported and should be moved to areas.
                </div>
              ` : ""}
        </div>
      ` : m`
      <div>
        <div class="card-section">
          ${n.isLocked ? m`
            <div class="lock-banner">
              <div class="lock-title">Locked</div>
              <div class="lock-details">
                ${n.lockedBy.length ? m`Held by ${n.lockedBy.join(", ")}.` : m`Occupancy is currently held by a lock.`}
              </div>
              ${n.lockModes.length ? m`
                    <div class="runtime-note">
                      Modes: ${n.lockModes.map((r) => this._lockModeLabel(r)).join(", ")}
                    </div>
                  ` : ""}
              ${n.directLocks.length ? m`
                    <div class="lock-directive-list">
                      ${n.directLocks.map((r) => m`
                        <div class="lock-directive">
                          <span class="lock-pill">${r.sourceId}</span>
                          <span>${this._lockModeLabel(r.mode)}</span>
                          <span>${this._lockScopeLabel(r.scope)}</span>
                        </div>
                      `)}
                    </div>
                  ` : m`<div class="runtime-note">Inherited from an ancestor subtree lock.</div>`}
            </div>
          ` : ""}
          <div class="section-title">
            Sources
          </div>
          <div class="subsection-help">
            ${i ? "Use the left control to include a source from this area. Included sources show editable behavior below." : "This location is integration-owned (no direct HA area mapping). Add sources explicitly from Home Assistant entities below."}
          </div>
          ${i ? "" : m`
                <div class="policy-note" style="margin-bottom: 10px; max-width: 820px;">
                  Tip: choose <strong>Any area / unassigned</strong> to browse all compatible entities.
                </div>
              `}
          ${this._renderAreaSensorList(t)}
          <div class="subsection-help">
            ${i ? "Need cross-area behavior? Add a source from another area." : "Add sources from any HA area (or unassigned entities)."}
          </div>
          ${this._renderExternalSourceComposer(t)}
        </div>
      </div>
    `;
  }
  _renderRuntimeStatus(t) {
    const e = this._getOccupancyState(), i = this._resolveOccupiedState(e);
    if (!e && i === void 0)
      return m`
        <div class="runtime-summary">
          <div class="runtime-summary-head">
            <span class="status-chip">Occupancy sensor unavailable</span>
            ${t.isLocked ? m`<span class="status-chip locked">Locked</span>` : ""}
          </div>
        </div>
      `;
    const o = (e == null ? void 0 : e.attributes) || {}, n = i === !0, r = this._resolveVacantAt(o, n), s = i === !0 ? "Occupied" : i === !1 ? "Vacant" : "Unknown", c = n ? r instanceof Date ? this._formatDateTime(r) : r === null ? "No timeout scheduled" : "Unknown" : "-";
    return m`
      <div class="runtime-summary">
        <div class="runtime-summary-head">
          <span class="status-chip ${n ? "occupied" : "vacant"}">${s}</span>
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
    return t === "color" ? "Color change" : t === "power" ? "Power" : t === "level" ? "Level change" : t === "volume" ? "Volume" : t === "mute" ? "Mute" : "Playback";
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
    return t.entityId.startsWith("light.") && (e === "power" || e === "level") ? `${t.entityId}::power-level` : t.key;
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
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const o = e.attributes || {};
    if (typeof o.brightness == "number") return !0;
    const n = o.supported_color_modes;
    return Array.isArray(n) ? n.some((c) => c && c !== "onoff") : !1;
  }
  _isColorCapableEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t];
    if (!e || t.split(".", 1)[0] !== "light") return !1;
    const o = e.attributes || {};
    if (o.rgb_color || o.hs_color || o.xy_color) return !0;
    const n = o.supported_color_modes;
    return Array.isArray(n) ? n.some((c) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(c)) : !1;
  }
  _renderAreaSensorList(t) {
    if (!this.location) return "";
    const e = !!this.location.ha_area_id, i = this._workingSources(t), o = /* @__PURE__ */ new Map();
    i.forEach((p, g) => o.set(this._sourceKeyFromSource(p), g));
    const s = [...this.location.entity_ids || []].sort(
      (p, g) => this._entityName(p).localeCompare(this._entityName(g))
    ).filter((p) => this._isCoreAreaSourceEntity(p)).flatMap(
      (p) => this._candidateItemsForEntity(p)
    ), c = s, d = new Set(s.map((p) => p.key)), u = i.filter((p) => !d.has(this._sourceKeyFromSource(p))).map((p) => ({
      key: this._sourceKeyFromSource(p),
      entityId: p.entity_id,
      signalKey: this._normalizedSignalKeyForSource(p)
    })), l = [...c, ...u].sort((p, g) => {
      const v = o.has(p.key), $ = o.has(g.key);
      if (v !== $) return v ? -1 : 1;
      const A = this._entityName(p.entityId).localeCompare(this._entityName(g.entityId));
      return A !== 0 ? A : this._signalSortWeight(p.signalKey) - this._signalSortWeight(g.signalKey);
    }), h = [], f = /* @__PURE__ */ new Map();
    for (const p of l) {
      const g = this._sourceCardGroupKey(p), v = f.get(g);
      if (v) {
        v.push(p);
        continue;
      }
      const $ = [p];
      f.set(g, $), h.push($);
    }
    return h.length ? m`
      <div class="candidate-list">
        ${h.map((p) => {
      const g = p.some((v) => o.has(v.key));
      return m`
            <div class="source-card ${g ? "enabled" : ""}">
              ${p.map((v, $) => {
        const A = o.get(v.key), k = A !== void 0, x = k ? i[A] : void 0, B = k && x ? x : void 0, F = this._modeOptionsForEntity(v.entityId);
        return m`
                  <div class=${`source-card-item${$ > 0 ? " grouped" : ""}`}>
                    <div class="candidate-item">
                      <div class="source-enable-control">
                        <input
                          type="checkbox"
                          class="source-enable-input"
                          aria-label="Include source"
                          .checked=${k}
                          @change=${(O) => {
          const Y = O.target.checked;
          Y && !k ? this._addSourceWithDefaults(v.entityId, t, {
            resetExternalPicker: !1,
            signalKey: v.signalKey
          }) || this.requestUpdate() : !Y && k && this._removeSource(A, t);
        }}
                        />
                      </div>
                      <div>
                        <div class="candidate-headline">
                          <div class="candidate-title">${this._candidateTitle(v.entityId, v.signalKey)}</div>
                          ${k && B && F.length > 1 ? m`
                                <div class="inline-mode-group">
                                  <span class="inline-mode-label">Mode</span>
                                  <select
                                    class="inline-mode-select"
                                    .value=${F.some((O) => O.value === B.mode) ? B.mode : F[0].value}
                                    @change=${(O) => {
          const Y = O.target.value, M = this.hass.states[v.entityId], ut = Pn(B, Y, M);
          this._updateSourceDraft(t, A, { ...ut, entity_id: B.entity_id });
        }}
                                  >
                                    ${F.map((O) => m`<option value=${O.value}>${O.label}</option>`)}
                                  </select>
                                </div>
                              ` : ""}
                        </div>
                        <div class="candidate-meta">${v.entityId} • ${this._entityState(v.entityId)}</div>
                        ${(this._isMediaEntity(v.entityId) || v.entityId.startsWith("light.")) && v.signalKey ? m`<div class="candidate-submeta">Signal: ${this._mediaSignalLabel(v.signalKey)}</div>` : ""}
                      </div>
                    </div>
                    ${k && x ? this._renderSourceEditor(t, x, A) : ""}
                  </div>
                `;
      })}
            </div>
          `;
    })}
      </div>
    ` : m`
        <div class="empty-state">
          <div class="text-muted">
            ${e ? m`No occupancy-relevant entities found yet. Add one from another area to get started.` : m`Add a source from Home Assistant entities below to get started.`}
          </div>
        </div>
      `;
  }
  _renderExternalSourceComposer(t) {
    var u;
    const e = this._availableSourceAreas(), i = this._externalAreaId || "", o = i ? this._entitiesForArea(i) : [], n = this._externalEntityId || "", r = new Set(this._workingSources(t).map((l) => this._sourceKeyFromSource(l))), s = n ? this._defaultSignalKeyForEntity(n) : void 0, c = n ? this._sourceKey(n, s) : "", d = (u = this.location) != null && u.ha_area_id ? "Other Area" : "Source Area";
    return m`
      <div class="external-composer">
        <div class="editor-field">
          <label for="external-source-area">${d}</label>
          <select
            id="external-source-area"
            data-testid="external-source-area-select"
            .value=${i}
            @change=${(l) => {
      const h = l.target.value;
      this._externalAreaId = h, this._externalEntityId = "", this.requestUpdate();
    }}
          >
            <option value="">Select area...</option>
            <option value="__all__">Any area / unassigned</option>
            ${e.map((l) => m`<option value=${l.area_id}>${l.name}</option>`)}
          </select>
        </div>

        <div class="editor-field">
          <label for="external-source-entity">Sensor</label>
          <select
            id="external-source-entity"
            data-testid="external-source-entity-select"
            .value=${n}
            @change=${(l) => {
      this._externalEntityId = l.target.value, this.requestUpdate();
    }}
            ?disabled=${!i}
          >
            <option value="">Select sensor...</option>
            ${o.map((l) => m`
              <option
                value=${l}
                ?disabled=${r.has(this._sourceKey(l, this._defaultSignalKeyForEntity(l)))}
              >
                ${this._entityName(l)}${r.has(this._sourceKey(l, this._defaultSignalKeyForEntity(l))) ? " (already added)" : ""}
              </option>
            `)}
          </select>
        </div>

        <button
          class="button button-secondary"
          data-testid="add-external-source-inline"
          ?disabled=${this._savingSource || !n || (c ? r.has(c) : !1)}
          @click=${() => {
      this._addSourceWithDefaults(n, t, {
        resetExternalPicker: !0,
        signalKey: this._defaultSignalKeyForEntity(n)
      });
    }}
        >
          + Add Source
        </button>
      </div>
    `;
  }
  _renderSourceEditor(t, e, i) {
    const o = e, n = this._eventLabelsForSource(e), r = this._sourceKeyFromSource(e), s = this._supportsOffBehavior(e), c = t.default_timeout || 300, d = this._onTimeoutMemory[r], u = o.on_timeout === null ? d ?? c : o.on_timeout ?? d ?? c, l = Math.max(1, Math.min(120, Math.round(u / 60))), h = o.off_trailing ?? 0, f = Math.max(0, Math.min(120, Math.round(h / 60)));
    return m`
      <div class="source-editor">
        ${(this._isMediaEntity(e.entity_id) || e.entity_id.startsWith("light.")) && e.signal_key ? m`<div class="media-signals">Signal: ${this._mediaSignalLabel(e.signal_key)} (${this._signalDescription(e.signal_key)}).</div>` : ""}
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
              @change=${(p) => {
      this._updateSourceDraft(t, i, {
        ...o,
        on_event: p.target.value
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
                .value=${String(l)}
                ?disabled=${o.on_timeout === null}
                @input=${(p) => {
      const g = Number(p.target.value) || 1;
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: g * 60
      }, this._updateSourceDraft(t, i, { ...o, on_timeout: g * 60 });
    }}
              />
              <input
                type="number"
                min="1"
                max="120"
                .value=${String(l)}
                ?disabled=${o.on_timeout === null}
                @change=${(p) => {
      const g = Math.max(1, Math.min(120, Number(p.target.value) || 1));
      this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: g * 60
      }, this._updateSourceDraft(t, i, { ...o, on_timeout: g * 60 });
    }}
              />
              <span class="text-muted">min</span>
            </div>
            <label class="editor-toggle">
              <input
                type="checkbox"
                .checked=${o.on_timeout === null}
                @change=${(p) => {
      const g = p.target.checked, v = this._onTimeoutMemory[r], $ = l * 60, A = v ?? $;
      g && (this._onTimeoutMemory = {
        ...this._onTimeoutMemory,
        [r]: o.on_timeout ?? A
      }), this._updateSourceDraft(t, i, {
        ...o,
        on_timeout: g ? null : A
      });
    }}
              />
              Indefinite (until ${n.offState})
            </label>
          </div>

          ${s ? m`
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
                    @change=${(p) => {
      this._updateSourceDraft(t, i, {
        ...o,
        off_event: p.target.value
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
                      @input=${(p) => {
      const g = Math.max(0, Math.min(120, Number(p.target.value) || 0));
      this._updateSourceDraft(t, i, { ...o, off_trailing: g * 60 });
    }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="120"
                      .value=${String(f)}
                      ?disabled=${(o.off_event || "none") !== "clear"}
                      @change=${(p) => {
      const g = Math.max(0, Math.min(120, Number(p.target.value) || 0));
      this._updateSourceDraft(t, i, { ...o, off_trailing: g * 60 });
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
    const e = this._actionTargetEntities(), i = t === "occupied" ? "When Occupied" : "When Vacant", o = t === "occupied" ? "Rules in this tab run when occupancy changes to occupied." : "Rules in this tab run when occupancy changes to vacant.";
    return m`
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
            ${this._loadingActionRules ? m`
                  <div class="empty-state">
                    <div class="text-muted">Loading device actions...</div>
                  </div>
                ` : this._actionRulesError ? m`
                    <div class="empty-state">
                      <div class="text-muted">${this._actionRulesError}</div>
                    </div>
                  ` : e.length === 0 ? m`
                  <div class="empty-state">
                    <div class="text-muted">
                      No common controllable devices found for this location yet.
                    </div>
                  </div>
                ` : e.map(
      (n) => {
        const r = this._isManagedActionEnabled(n, t), s = this._actionToggleKey(n, t), c = !!this._actionToggleBusy[s], d = this._selectedManagedActionService(n, t), u = this._selectedManagedActionRequireDark(n, t), l = this._supportsDarkCondition(t), h = this._actionServiceOptions(n, t);
        return m`
                    <div class="source-item action-device-row ${r ? "enabled" : ""}">
                      <div class="action-include-control">
                        <input
                          type="checkbox"
                          class="action-include-input"
                          .checked=${r}
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
                        <div class="source-name">${this._entityName(n)}</div>
                        <div class="source-details">
                          Entity: ${n}
                        </div>
                        <div class="source-details">
                          Current state: ${this._entityState(n)}
                        </div>
                      </div>
                      <div class="action-controls">
                        <select
                          class="action-service-select"
                          .value=${Tn(d)}
                          ?disabled=${c || this._loadingActionRules}
                          @change=${(f) => this._handleManagedActionServiceChange(
          n,
          t,
          f.target.value
        )}
                        >
                          ${h.map(
          (f) => m`<option value=${f.value}>${f.label}</option>`
        )}
                        </select>
                        ${l ? m`
                              <label class="action-dark-toggle">
                                <input
                                  type="checkbox"
                                  class="action-dark-input"
                                  .checked=${u}
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
                        ${c ? m`<span class="text-muted">Saving...</span>` : ""}
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
    return m`
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
          Reapply occupancy actions on startup
        </label>
        <div class="startup-inline-help">
          Applies to both On Occupied and On Vacant actions after Home Assistant startup.
        </div>
      </div>
    `;
  }
  _actionToggleKey(t, e) {
    return `${e}:${t}`;
  }
  _actionTargetEntities() {
    if (!this.location) return [];
    const t = /* @__PURE__ */ new Set();
    for (const e of this.location.entity_ids || [])
      this._isActionDeviceEntity(e) && t.add(e);
    if (this.location.ha_area_id)
      for (const e of this._entitiesForArea(this.location.ha_area_id))
        this._isActionDeviceEntity(e) && t.add(e);
    return [...t].sort((e, i) => {
      const o = this._actionDeviceType(e) || "zzzz", n = this._actionDeviceType(i) || "zzzz";
      return o !== n ? o.localeCompare(n) : this._entityName(e).localeCompare(this._entityName(i));
    });
  }
  _isActionDeviceEntity(t) {
    return !!this._actionDeviceType(t);
  }
  _actionDeviceType(t) {
    var u, l;
    const e = (l = (u = this.hass) == null ? void 0 : u.states) == null ? void 0 : l[t];
    if (!e) return;
    const i = t.split(".", 1)[0], o = e.attributes || {};
    if (i === "fan") return "fan";
    if (i === "media_player") {
      const h = String(o.device_class || "").toLowerCase(), f = `${o.friendly_name || ""} ${t}`.toLowerCase();
      return h === "tv" || /\btv\b/.test(f) || f.includes("television") ? "tv" : "stereo";
    }
    if (i !== "light") return;
    const n = Array.isArray(o.supported_color_modes) ? o.supported_color_modes : [], r = n.some(
      (h) => ["hs", "xy", "rgb", "rgbw", "rgbww", "color_temp"].includes(String(h))
    ), s = Array.isArray(o.hs_color) || Array.isArray(o.xy_color) || Array.isArray(o.rgb_color) || typeof o.color_temp_kelvin == "number" || typeof o.color_temp == "number";
    if (r || s) return "color_light";
    const c = n.some((h) => String(h) !== "onoff"), d = typeof o.brightness == "number" || typeof o.brightness_pct == "number" || typeof o.brightness_step == "number" || typeof o.brightness_step_pct == "number";
    return c || d ? "dimmer" : "light";
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
      ].sort((r, s) => r.value === n ? -1 : s.value === n ? 1 : 0);
    }
    const o = this._defaultManagedActionService(t, e);
    return [
      { value: "turn_on", label: "Turn on" },
      { value: "turn_off", label: "Turn off" },
      { value: "toggle", label: "Toggle" }
    ].sort((n, r) => n.value === o ? -1 : r.value === o ? 1 : 0);
  }
  _actionServiceLabel(t) {
    return t.split("_").map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ");
  }
  _supportsDarkCondition(t) {
    return t === "occupied";
  }
  _selectedManagedActionService(t, e) {
    const i = this._actionToggleKey(t, e), o = this._actionServiceSelections[i];
    if (o) return o;
    const n = this._rulesForManagedActionEntity(t, e), r = n.find(
      (c) => c.enabled && typeof c.action_service == "string" && c.action_service.length > 0
    );
    if (r != null && r.action_service) return r.action_service;
    const s = n.find(
      (c) => typeof c.action_service == "string" && c.action_service.length > 0
    );
    return s != null && s.action_service ? s.action_service : this._defaultManagedActionService(t, e);
  }
  _selectedManagedActionRequireDark(t, e) {
    if (!this._supportsDarkCondition(e))
      return !1;
    const i = this._actionToggleKey(t, e);
    if (Object.prototype.hasOwnProperty.call(this._actionDarkSelections, i))
      return !!this._actionDarkSelections[i];
    const o = this._rulesForManagedActionEntity(t, e), n = o.find((s) => s.enabled);
    if (n)
      return !!n.require_dark;
    const r = o[0];
    return r ? !!r.require_dark : !1;
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
      o < e - 1 && await new Promise((r) => window.setTimeout(r, i));
    }
    return !1;
  }
  _deviceIcon(t) {
    const e = this._actionDeviceType(t);
    return e === "light" ? "mdi:lightbulb-outline" : e === "dimmer" ? "mdi:lightbulb-on" : e === "color_light" ? "mdi:palette" : e === "fan" ? "mdi:fan" : e === "stereo" ? "mdi:speaker" : e === "tv" ? "mdi:television" : "mdi:robot";
  }
  _managedRuleName(t, e) {
    var s;
    const i = ((s = this.location) == null ? void 0 : s.name) || "Location", o = this._entityName(t), n = this._selectedManagedActionService(t, e).replace(/_/g, " ");
    return `${i} ${e === "occupied" ? "Occupied" : "Vacant"}: ${o} (${n})`;
  }
  async _replaceManagedActionRules(t, e, i, o) {
    if (!this.location) return;
    const n = this._rulesForManagedActionEntity(t, e);
    return n.length > 0 && await Promise.all(
      n.map((s) => Pi(this.hass, s, this.entryId))
    ), await Vn(this.hass, {
      location: this.location,
      name: this._managedRuleName(t, e),
      trigger_type: e,
      action_entity_id: t,
      action_service: i,
      require_dark: o
    }, this.entryId);
  }
  _setManagedActionRuleLocal(t, e, i, o, n) {
    const r = {
      ...t,
      trigger_type: i,
      action_entity_id: e,
      action_service: o,
      require_dark: n,
      enabled: !0
    }, s = this._actionRules.filter(
      (c) => !(c.trigger_type === i && c.action_entity_id === e)
    );
    this._actionRules = [...s, r];
  }
  _removeManagedActionRulesLocal(t, e) {
    this._actionRules = this._actionRules.filter(
      (i) => !(i.trigger_type === e && i.action_entity_id === t)
    );
  }
  async _handleManagedActionServiceChange(t, e, i) {
    var r;
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
      const s = this._selectedManagedActionRequireDark(t, e), c = await this._replaceManagedActionRules(
        t,
        e,
        i,
        s
      );
      c && this._setManagedActionRuleLocal(
        c,
        t,
        e,
        i,
        s
      ), await this._reloadActionRulesUntil(
        () => this._isManagedActionServiceSelected(t, e, i) && this._isManagedActionRequireDarkSelected(t, e, s)
      ) || this._showToast(
        "Saved, but Topomation could not verify the updated automation yet. Check browser console logs for details.",
        "error"
      );
    } catch (s) {
      console.error("Failed to update managed action service", {
        locationId: (r = this.location) == null ? void 0 : r.id,
        entityId: t,
        triggerType: e,
        actionService: i,
        error: s
      }), this._showToast((s == null ? void 0 : s.message) || "Failed to update automation", "error");
    } finally {
      const { [o]: s, ...c } = this._actionToggleBusy;
      this._actionToggleBusy = c, this.requestUpdate();
    }
  }
  async _handleManagedActionDarkChange(t, e, i) {
    var r;
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
      const s = this._selectedManagedActionService(t, e), c = await this._replaceManagedActionRules(
        t,
        e,
        s,
        i
      );
      c && this._setManagedActionRuleLocal(
        c,
        t,
        e,
        s,
        i
      ), await this._reloadActionRulesUntil(
        () => this._isManagedActionServiceSelected(t, e, s) && this._isManagedActionRequireDarkSelected(t, e, i)
      ) || this._showToast(
        "Saved, but Topomation could not verify the updated automation yet. Check browser console logs for details.",
        "error"
      );
    } catch (s) {
      console.error("Failed to update managed action dark condition", {
        locationId: (r = this.location) == null ? void 0 : r.id,
        entityId: t,
        triggerType: e,
        requireDark: i,
        error: s
      }), this._showToast((s == null ? void 0 : s.message) || "Failed to update automation", "error");
    } finally {
      const { [o]: s, ...c } = this._actionToggleBusy;
      this._actionToggleBusy = c, this.requestUpdate();
    }
  }
  async _handleManagedActionToggle(t, e, i) {
    var n;
    if (!this.location) return;
    const o = this._actionToggleKey(t, e);
    this._actionToggleBusy = { ...this._actionToggleBusy, [o]: !0 }, this.requestUpdate();
    try {
      const r = this._rulesForManagedActionEntity(t, e), s = this._selectedManagedActionService(t, e), c = this._selectedManagedActionRequireDark(t, e);
      if (i) {
        const u = await this._replaceManagedActionRules(
          t,
          e,
          s,
          c
        );
        u && this._setManagedActionRuleLocal(
          u,
          t,
          e,
          s,
          c
        );
      } else r.length > 0 && (await Promise.all(
        r.map((u) => Pi(this.hass, u, this.entryId))
      ), this._removeManagedActionRulesLocal(t, e));
      await this._reloadActionRulesUntil(
        () => this._isManagedActionEnabled(t, e) === i && (!i || this._isManagedActionServiceSelected(t, e, s) && this._isManagedActionRequireDarkSelected(t, e, c))
      ) || this._showToast(
        "Saved, but Topomation could not verify the updated automation yet. Check browser console logs for details.",
        "error"
      );
    } catch (r) {
      console.error("Failed to update managed action rule", {
        locationId: (n = this.location) == null ? void 0 : n.id,
        entityId: t,
        triggerType: e,
        nextEnabled: i,
        error: r
      }), this._showToast((r == null ? void 0 : r.message) || "Failed to update automation", "error");
    } finally {
      const { [o]: r, ...s } = this._actionToggleBusy;
      this._actionToggleBusy = s, this.requestUpdate();
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
    const r = this._modeOptionsForEntity(n.entity_id).map((c) => c.value), s = this._normalizeSource(
      n.entity_id,
      {
        ...i,
        mode: r.includes(i.mode) ? i.mode : r[0]
      }
    );
    o[e] = s, this._setWorkingSources(o);
  }
  _removeSource(t, e) {
    const i = this._workingSources(e), o = i[t];
    if (!o) return;
    i.splice(t, 1);
    const n = { ...this._onTimeoutMemory };
    delete n[this._sourceKeyFromSource(o)], this._onTimeoutMemory = n, this._setWorkingSources(i);
  }
  _addSourceWithDefaults(t, e, i) {
    if (!this.location) return !1;
    if (this._isFloorLocation())
      return this._showToast("Floor locations do not support occupancy sources.", "error"), !1;
    const o = this._workingSources(e), n = this._sourceKey(t, i == null ? void 0 : i.signalKey);
    if (o.some((u) => this._sourceKeyFromSource(u) === n))
      return !1;
    const r = this.hass.states[t];
    if (!r)
      return this._showToast(`Entity not found: ${t}`, "error"), !1;
    let c = mo(r);
    (i == null ? void 0 : i.signalKey) === "playback" || (i == null ? void 0 : i.signalKey) === "volume" || (i == null ? void 0 : i.signalKey) === "mute" ? c = this._mediaSignalDefaults(t, i.signalKey) : ((i == null ? void 0 : i.signalKey) === "power" || (i == null ? void 0 : i.signalKey) === "level" || (i == null ? void 0 : i.signalKey) === "color") && (c = this._lightSignalDefaults(t, i.signalKey));
    const d = this._normalizeSource(t, c);
    return this._setWorkingSources([...o, d]), i != null && i.resetExternalPicker && (this._externalAreaId = "", this._externalEntityId = "", this.requestUpdate()), !0;
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
    var l;
    const i = this._isMediaEntity(t), o = this._isDimmableEntity(t), n = this._isColorCapableEntity(t), r = (l = e.source_id) != null && l.includes("::") ? e.source_id.split("::")[1] : void 0, s = this._defaultSignalKeyForEntity(t), c = e.signal_key || r || s;
    let d;
    (i && (c === "playback" || c === "volume" || c === "mute") || (o || n) && (c === "power" || c === "level" || c === "color")) && (d = c);
    const u = e.source_id || this._sourceKey(t, d);
    return {
      entity_id: t,
      source_id: u,
      signal_key: d,
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
    var o, n;
    const t = (o = this.location) == null ? void 0 : o.ha_area_id, e = ((n = this.hass) == null ? void 0 : n.areas) || {};
    return Object.values(e).filter((r) => !!r.area_id).filter((r) => r.area_id !== t).map((r) => ({
      area_id: r.area_id,
      name: r.name || r.area_id
    })).sort((r, s) => r.name.localeCompare(s.name));
  }
  _entitiesForArea(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    return t === "__all__" ? Object.keys(e).filter((o) => this._isCandidateEntity(o)).sort((o, n) => this._entityName(o).localeCompare(this._entityName(n))) : Object.keys(e).filter((o) => {
      var r, s;
      const n = this._entityAreaById[o];
      return n !== void 0 ? n === t : ((s = (r = e[o]) == null ? void 0 : r.attributes) == null ? void 0 : s.area_id) === t;
    }).filter((o) => this._isCandidateEntity(o)).sort((o, n) => this._entityName(o).localeCompare(this._entityName(n)));
  }
  _isCandidateEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t];
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
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t];
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
      const r = (n == null ? void 0 : n.attributes) || {};
      if (r.device_class === "occupancy" && r.location_id === this.location.id)
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
    const n = String(t || "").trim(), r = o.map((s) => String((s == null ? void 0 : s.source_id) || "").trim()).filter((s) => s.length > 0 && s !== n);
    return Array.from(new Set(r));
  }
  _getLockState() {
    const t = this._getOccupancyState(), e = (t == null ? void 0 : t.attributes) || {}, i = e.locked_by, o = e.lock_modes, n = e.direct_locks, r = Array.isArray(i) ? i.map((d) => String(d)) : [], s = Array.isArray(o) ? o.map((d) => String(d)) : [], c = Array.isArray(n) ? n.map((d) => ({
      sourceId: String((d == null ? void 0 : d.source_id) || "unknown"),
      mode: String((d == null ? void 0 : d.mode) || "freeze"),
      scope: String((d == null ? void 0 : d.scope) || "self")
    })).sort(
      (d, u) => `${d.sourceId}:${d.mode}:${d.scope}`.localeCompare(`${u.sourceId}:${u.mode}:${u.scope}`)
    ) : [];
    return {
      isLocked: !!e.is_locked,
      lockedBy: r,
      lockModes: s,
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
    let n = !1, r;
    for (const s of o) {
      const c = s == null ? void 0 : s.expires_at;
      if (c == null) {
        n = !0;
        continue;
      }
      const d = this._parseDateValue(c);
      d && (!r || d.getTime() > r.getTime()) && (r = d);
    }
    return n ? null : r;
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
    const i = Math.floor(e / 86400), o = Math.floor(e % 86400 / 3600), n = Math.floor(e % 3600 / 60), r = e % 60, s = [];
    return i > 0 && s.push(`${i}d`), o > 0 && s.push(`${o}h`), n > 0 && s.length < 2 && s.push(`${n}m`), (s.length === 0 || i === 0 && o === 0 && n === 0) && s.push(`${r}s`), s.slice(0, 2).join(" ");
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
    const i = t.mode === "any_change" ? "Any change" : "Specific states", o = t.on_timeout === null ? null : t.on_timeout ?? e, n = t.off_trailing ?? 0, r = t.on_event === "trigger" ? `ON: trigger (${this._formatDuration(o)})` : "ON: ignore", s = t.off_event === "clear" ? `OFF: clear (${this._formatDuration(n)})` : "OFF: ignore";
    return `${i} • ${r} • ${s}`;
  }
  _renderSourceEventChips(t, e) {
    const i = [], o = t.on_timeout === null ? null : t.on_timeout ?? e, n = t.off_trailing ?? 0;
    return t.on_event === "trigger" ? i.push(m`<span class="event-chip">ON -> trigger (${this._formatDuration(o)})</span>`) : i.push(m`<span class="event-chip ignore">ON ignored</span>`), t.off_event === "clear" ? i.push(
      m`<span class="event-chip off">OFF -> clear (${this._formatDuration(n)})</span>`
    ) : i.push(m`<span class="event-chip ignore">OFF ignored</span>`), i;
  }
  _modeOptionsForEntity(t) {
    var r, s;
    const e = (s = (r = this.hass) == null ? void 0 : r.states) == null ? void 0 : s[t], i = (e == null ? void 0 : e.attributes) || {}, o = t.split(".", 1)[0], n = String(i.device_class || "");
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
    var d, u;
    const e = t.entity_id, i = (u = (d = this.hass) == null ? void 0 : d.states) == null ? void 0 : u[e], o = (i == null ? void 0 : i.attributes) || {}, n = e.split(".", 1)[0], r = String(o.device_class || "");
    let s = "ON", c = "OFF";
    if (n === "binary_sensor" && ["door", "garage_door", "opening", "window"].includes(r))
      s = "Open", c = "Closed";
    else if (n === "binary_sensor" && r === "motion")
      s = "Motion", c = "No motion";
    else if (n === "binary_sensor" && ["presence", "occupancy"].includes(r))
      s = "Detected", c = "Not detected";
    else if (n === "person" || n === "device_tracker")
      s = "Home", c = "Away";
    else {
      if (n === "media_player")
        return t.signal_key === "volume" ? {
          onState: "Volume change",
          offState: "No volume change",
          onBehavior: "Volume change behavior",
          onTimeout: "Volume timeout",
          offBehavior: "No-volume behavior",
          offDelay: "No-volume delay"
        } : t.signal_key === "mute" ? {
          onState: "Mute change",
          offState: "No mute change",
          onBehavior: "Mute change behavior",
          onTimeout: "Mute timeout",
          offBehavior: "No-mute behavior",
          offDelay: "No-mute delay"
        } : {
          onState: "Playing",
          offState: "Paused/idle",
          onBehavior: "Playing behavior",
          onTimeout: "Playing timeout",
          offBehavior: "Paused/idle behavior",
          offDelay: "Paused/idle delay"
        };
      if (n === "light" && t.signal_key === "level")
        return {
          onState: "Level change",
          offState: "No level change",
          onBehavior: "Level change behavior",
          onTimeout: "Level timeout",
          offBehavior: "No-level behavior",
          offDelay: "No-level delay"
        };
      if (n === "light" && t.signal_key === "color")
        return {
          onState: "Color change",
          offState: "No color change",
          onBehavior: "Color change behavior",
          onTimeout: "Color timeout",
          offBehavior: "No-color behavior",
          offDelay: "No-color delay"
        };
      (n === "light" && t.signal_key === "power" || n === "light" || n === "switch" || n === "fan") && (s = "On", c = "Off");
    }
    return {
      onState: s,
      offState: c,
      onBehavior: `${s} behavior`,
      onTimeout: `${s} timeout`,
      offBehavior: `${c} behavior`,
      offDelay: `${c} delay`
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
          const r = (this.location.modules.occupancy || {}).default_timeout || 300, s = t.on_timeout === null ? r : t.on_timeout ?? r, c = t.source_id || t.entity_id;
          await this.hass.callWS({
            type: "call_service",
            domain: "topomation",
            service: "trigger",
            service_data: this._serviceDataWithEntryId({
              location_id: this.location.id,
              source_id: c,
              timeout: s
            })
          }), this.dispatchEvent(
            new CustomEvent("source-test", {
              detail: {
                action: "trigger",
                locationId: this.location.id,
                sourceId: c,
                timeout: s
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
          const r = this._activeContributorsExcluding(o);
          if (r.length > 0) {
            const s = r.slice(0, 2).join(", "), c = r.length > 2 ? ` +${r.length - 2} more` : "";
            this._showToast(`Cleared ${o}; still occupied by ${s}${c}`, "error");
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
    const n = o * 60, r = e.closest(".config-value");
    if (r) {
      const c = r.querySelector("input.timeout-slider");
      c && (c.value = String(o));
      const d = r.querySelector("input.input");
      d && (d.value = String(o));
    }
    if (!this.location || this._isFloorLocation()) return;
    const s = this.location.modules.occupancy || {};
    this._updateConfig({ ...s, default_timeout: n });
  }
  async _updateConfig(t) {
    await this._updateModuleConfig("occupancy", t);
  }
  _isFloorLocation() {
    return !!this.location && xt(this.location) === "floor";
  }
};
ve.properties = {
  hass: { attribute: !1 },
  location: { attribute: !1 },
  entryId: { attribute: !1 },
  entityRegistryRevision: { type: Number },
  forcedTab: { type: String },
  occupancyStates: { attribute: !1 }
}, ve.styles = [
  xe,
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

      .candidate-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--spacing-md);
        align-items: center;
        padding: 10px 12px;
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

      .candidate-meta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .candidate-submeta {
        margin-top: 2px;
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .candidate-headline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
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
        padding: 10px 12px;
        background: rgba(var(--rgb-primary-color), 0.07);
      }

      .editor-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 10px 12px;
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
      }
    `
];
let Xe = ve;
if (!customElements.get("ht-location-inspector"))
  try {
    customElements.define("ht-location-inspector", Xe);
  } catch (a) {
    console.error("[ht-location-inspector] failed to define element", a);
  }
console.log("[ht-location-dialog] module loaded");
var Fi, zi;
try {
  (zi = (Fi = import.meta) == null ? void 0 : Fi.hot) == null || zi.accept(() => window.location.reload());
} catch {
}
const ye = class ye extends dt {
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
      if (console.log("[LocationDialog] willUpdate - open changed:", n, "->", this.open), console.log("[LocationDialog] Locations available:", this.locations.length, this.locations.map((r) => {
        var s, c;
        return `${r.name}(${(c = (s = r.modules) == null ? void 0 : s._meta) == null ? void 0 : c.type})`;
      })), this.open && !n) {
        if (console.log("[LocationDialog] Dialog opening, location:", this.location), this.location) {
          const r = ((e = this.location.modules) == null ? void 0 : e._meta) || {}, s = this.location.ha_area_id && ((i = this.hass) != null && i.areas) ? (o = this.hass.areas[this.location.ha_area_id]) == null ? void 0 : o.icon : void 0;
          this._config = {
            name: this.location.name,
            type: r.type || "area",
            parent_id: this.location.parent_id || void 0,
            // ADR: Icons are sourced from Home Assistant Area Registry (not stored in _meta.icon)
            icon: s || void 0
          };
        } else {
          const r = this.defaultType ?? "area", s = this.defaultParentId;
          this._config = {
            name: "",
            type: r,
            parent_id: s || void 0
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
          const r = e.shadowRoot.querySelector('input[type="text"]');
          if (r) {
            console.log("[LocationDialog] Focusing input:", r), r.focus(), r.select();
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
    return console.log("[LocationDialog] Rendering dialog with schema:", t.length, "fields"), m`
      <ha-dialog
        .open=${this.open}
        data-testid="location-dialog"
        @closed=${this._handleClosed}
        .heading=${this.location ? "Edit Location" : "New Location"}
      >
        <div class="dialog-content">
          ${this._error ? m`
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
    const t = this._config.type, e = qe(t);
    if (e.length === 1 && e[0] === "root")
      return [];
    const o = e.filter((r) => r !== "root");
    if (console.log("[LocationDialog] _getValidParents:", {
      currentType: t,
      allowedParentTypes: e,
      filteredTypes: o,
      totalLocations: this.locations.length
    }), o.length === 0) return [];
    const n = this.locations.filter((r) => {
      if (r.is_explicit_root) return !1;
      const s = xt(r);
      return o.includes(s);
    }).map((r) => ({
      value: r.id,
      label: r.name
    }));
    return console.log("[LocationDialog] Valid parents:", n.length, n.map((r) => r.label)), n;
  }
  _includeRootOption() {
    return !1;
  }
  _submitParentId() {
    const t = qe(this._config.type);
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
ye.properties = {
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
}, ye.styles = [
  xe,
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
let Qe = ye;
customElements.get("ht-location-dialog") || customElements.define("ht-location-dialog", Qe);
const Ri = "topomation:panel-tree-split", Oi = "topomation:panel-right-mode", Fe = 0.4, ze = 0.25, Ue = 0.75, Gn = "application/x-topomation-entity-id";
var Ui, Ki;
try {
  (Ki = (Ui = import.meta) == null ? void 0 : Ui.hot) == null || Ki.accept(() => window.location.reload());
} catch {
}
const be = class be extends dt {
  constructor() {
    super(), this.narrow = !1, this._locations = [], this._locationsVersion = 0, this._loading = !0, this._pendingChanges = /* @__PURE__ */ new Map(), this._saving = !1, this._discarding = !1, this._locationDialogOpen = !1, this._eventLogOpen = !1, this._eventLogScope = "subtree", this._eventLogEntries = [], this._occupancyStateByLocation = {}, this._treePanelSplit = Fe, this._isResizingPanels = !1, this._entityAreaById = {}, this._entitySearch = "", this._assignBusyByEntityId = {}, this._rightPanelMode = "inspector", this._assignmentFilter = "all", this._deviceGroupExpanded = {}, this._haRegistryRevision = 0, this._hasLoaded = !1, this._loadSeq = 0, this._entityAreaIndexLoaded = !1, this._entityAreaRevision = 0, this._deviceGroupsCache = [], this._opQueueByLocationId = /* @__PURE__ */ new Map(), this._handleDeviceSearch = (t) => {
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
        t.preventDefault(), this._setPanelSplit(ze, !0);
        return;
      }
      t.key === "End" && (t.preventDefault(), this._setPanelSplit(Ue, !0));
    }, this._handlePanelSplitterReset = () => {
      this._setPanelSplit(Fe, !0);
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
    super.disconnectedCallback(), document.removeEventListener("keydown", this._handleKeyDown), this._stopPanelSplitterDrag(), this._pendingLoadTimer && (clearTimeout(this._pendingLoadTimer), this._pendingLoadTimer = void 0), this._reloadTimer && (clearTimeout(this._reloadTimer), this._reloadTimer = void 0), this._registryRefreshTimer && (clearTimeout(this._registryRefreshTimer), this._registryRefreshTimer = void 0), this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0), this._unsubEntityRegistryUpdated && (this._unsubEntityRegistryUpdated(), this._unsubEntityRegistryUpdated = void 0), this._unsubDeviceRegistryUpdated && (this._unsubDeviceRegistryUpdated(), this._unsubDeviceRegistryUpdated = void 0), this._unsubAreaRegistryUpdated && (this._unsubAreaRegistryUpdated(), this._unsubAreaRegistryUpdated = void 0);
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
      return m`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    if (this._error)
      return m`
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
    ), e = this._managerView(), i = this._managerHeader(e), o = e === "location" ? void 0 : e, n = "Automation", r = this._deleteDisabledReason(t), s = `${(this._treePanelSplit * 100).toFixed(1)}%`;
    return m`
      <div class="panel-container" style=${`--tree-panel-basis: ${s};`}>
        <div class="panel-left">
          ${this._renderConflictBanner()}
          ${this._locations.length === 0 ? this._renderEmptyStateBanner() : ""}
          <div class="header">
            <div class="header-title">${i.title}</div>
            <div class="header-subtitle">
              ${i.subtitle}
            </div>
            <div class="header-actions">
              ${this._isSplitStackedLayout() ? m`
                    <button
                      class="button button-secondary"
                      @click=${this._handleOpenSidebar}
                      aria-label="Open Home Assistant sidebar"
                    >
                      Sidebar
                    </button>
                  ` : ""}
              ${m`
                    <button class="button button-primary" @click=${this._handleNewLocation}>
                      + Add Structure
                    </button>
                  `}
              <button
                class="button button-secondary"
                @click=${this._handleDeleteSelected}
                title=${r}
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
          aria-valuemin=${Math.round(ze * 100)}
          aria-valuemax=${Math.round(Ue * 100)}
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
          ${this._rightPanelMode === "assign" ? this._renderDeviceAssignmentPanel(t) : m`
                <ht-location-inspector
                  .hass=${this.hass}
                  .location=${t}
                  .entryId=${this._activeEntryId()}
                  .entityRegistryRevision=${this._haRegistryRevision}
                  .forcedTab=${o}
                  .occupancyStates=${this._occupancyStateByLocation}
                  @source-test=${this._handleSourceTest}
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
    return m`
      <ht-location-dialog
        .hass=${this.hass}
        .open=${this._locationDialogOpen}
        .location=${this._editingLocation}
        .locations=${this._locations}
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
            for (const l of o) {
              const h = typeof (l == null ? void 0 : l.id) == "string" ? l.id : void 0, f = typeof (l == null ? void 0 : l.area_id) == "string" ? l.area_id : void 0;
              h && f && n.set(h, f);
            }
          const r = {};
          if (Array.isArray(i))
            for (const l of i) {
              const h = typeof (l == null ? void 0 : l.entity_id) == "string" ? l.entity_id : void 0;
              if (!h) continue;
              const f = typeof (l == null ? void 0 : l.area_id) == "string" ? l.area_id : void 0, p = typeof (l == null ? void 0 : l.device_id) == "string" ? n.get(l.device_id) : void 0;
              r[h] = f || p || null;
            }
          const s = this._entityAreaById, c = Object.keys(s), d = Object.keys(r);
          (c.length !== d.length || d.some((l) => s[l] !== r[l])) && (this._entityAreaById = r, this._entityAreaRevision += 1), this._entityAreaIndexLoaded = !0;
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
    const e = !this._entityAreaIndexLoaded && !!this._entityAreaIndexPromise, i = this._buildDeviceGroups(), o = this._visibleDeviceGroups(i), n = this._assignmentFilterStats(i), r = t ? t.name : "Select a location";
    return m`
      <div class="device-assignment-panel">
        <div class="device-panel-head">
          <div class="device-panel-title">Device Assignment</div>
          <div class="device-panel-subtitle">
            Assign target: <strong>${r}</strong>
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
        ${e ? m`<div class="device-empty">Loading area mapping…</div>` : ""}

        ${o.length === 0 ? m`<div class="device-empty">No devices match the current filter.</div>` : o.map((s) => this._renderDeviceGroup(s, t == null ? void 0 : t.id))}
      </div>
    `;
  }
  _renderDeviceGroup(t, e) {
    const i = this._isGroupExpanded(t.key);
    return m`
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
        ${i ? t.entities.length === 0 ? m`<div class="device-empty">No devices in this group.</div>` : t.entities.map((o) => {
      const n = !!this._assignBusyByEntityId[o], r = this._entityDisplayName(o);
      return m`
                <div
                  class="device-row"
                  draggable="true"
                  data-entity-id=${o}
                  @dragstart=${(s) => this._handleDeviceDragStart(s, o)}
                >
                  <div>
                    <div class="device-name">${r}</div>
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
    (i = t.dataTransfer) == null || i.setData(Gn, e), (o = t.dataTransfer) == null || o.setData("text/plain", e), t.dataTransfer && (t.dataTransfer.effectAllowed = "move");
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
    var o, n, r;
    const e = (n = (o = this.hass) == null ? void 0 : o.states) == null ? void 0 : n[t], i = (r = e == null ? void 0 : e.attributes) == null ? void 0 : r.friendly_name;
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
    const e = xt(t);
    return e === "area" ? "area" : e === "subarea" ? "subarea" : e === "floor" ? "floor" : e === "building" ? "building" : e === "grounds" ? "grounds" : "other";
  }
  _buildDeviceGroups() {
    var u;
    const t = this._entitySearch.trim().toLowerCase(), e = Object.keys(((u = this.hass) == null ? void 0 : u.states) || {}).length, i = `${t}|${e}|${this._locationsVersion}|${this._entityAreaRevision}`;
    if (this._deviceGroupsCacheKey === i)
      return this._deviceGroupsCache;
    const o = new Map(this._locations.map((l) => [l.id, l])), n = /* @__PURE__ */ new Map();
    for (const l of this._locations)
      for (const h of l.entity_ids || [])
        h && !n.has(h) && n.set(h, l.id);
    const r = /* @__PURE__ */ new Map(), s = (l, h, f, p) => {
      const g = r.get(l);
      if (g) return g;
      const v = { key: l, label: h, type: f, locationId: p, entities: [] };
      return r.set(l, v), v;
    };
    s("unassigned", "Unassigned", "unassigned");
    for (const l of this._allKnownEntityIds()) {
      if (!this._isAssignableEntity(l)) continue;
      const h = this._entityDisplayName(l), f = n.get(l), p = f ? o.get(f) : void 0, g = this._areaLabel(this._effectiveAreaIdForEntity(l));
      if (t && !`${h} ${l} ${(p == null ? void 0 : p.name) || ""} ${g}`.toLowerCase().includes(t))
        continue;
      if (!p) {
        s("unassigned", "Unassigned", "unassigned").entities.push(l);
        continue;
      }
      const v = this._groupTypeForLocation(p);
      s(
        p.id,
        p.name,
        v,
        p.id
      ).entities.push(l);
    }
    for (const l of r.values())
      l.entities.sort(
        (h, f) => this._entityDisplayName(h).localeCompare(this._entityDisplayName(f))
      );
    const c = {
      unassigned: 0,
      area: 1,
      subarea: 2,
      floor: 3,
      building: 4,
      grounds: 5,
      other: 6
    }, d = [...r.values()].filter((l) => l.entities.length > 0 || l.key === "unassigned").sort((l, h) => {
      const f = c[l.type] - c[h.type];
      return f !== 0 ? f : l.label.localeCompare(h.label);
    });
    return this._deviceGroupsCacheKey = i, this._deviceGroupsCache = d, d;
  }
  _applyEntityAssignmentLocally(t, e) {
    const i = this._locations.map((n) => ({
      ...n,
      entity_ids: (n.entity_ids || []).filter((r) => r !== t)
    })), o = i.find((n) => n.id === e);
    o && !o.entity_ids.includes(t) && (o.entity_ids = [...o.entity_ids, t]), this._locations = i, this._locationsVersion += 1, o != null && o.ha_area_id && (this._entityAreaById = { ...this._entityAreaById, [t]: o.ha_area_id }, this._entityAreaRevision += 1);
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
      const { [t]: n, ...r } = this._assignBusyByEntityId;
      this._assignBusyByEntityId = r;
    }
  }
  async _loadLocations(t = !1) {
    var o;
    const e = ++this._loadSeq, i = t || this._locations.length > 0;
    this._loading = !i, this._error = void 0;
    try {
      if (!this.hass)
        throw new Error("Home Assistant connection not ready");
      const r = await Promise.race([
        this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/list"
          })
        ),
        new Promise(
          (u, l) => setTimeout(() => l(new Error("Timeout loading locations")), 8e3)
        )
      ]);
      if (!r || !r.locations)
        throw new Error("Invalid response format: missing locations array");
      if (e !== this._loadSeq)
        return;
      const s = /* @__PURE__ */ new Map();
      for (const u of r.locations) s.set(u.id, u);
      const d = Array.from(s.values()).filter((u) => !u.is_explicit_root);
      this._locations = [...d], this._occupancyStateByLocation = this._buildOccupancyStateMapFromStates(), this._locationsVersion += 1, this._logEvent("ws", "locations/list loaded", {
        count: this._locations.length
      }), (!this._selectedId || !this._locations.some((u) => u.id === this._selectedId)) && (this._selectedId = (o = this._locations[0]) == null ? void 0 : o.id), this._rightPanelMode === "assign" && this._ensureEntityAreaIndex();
    } catch (n) {
      console.error("Failed to load locations:", n), this._error = n.message || "Failed to load locations", this._logEvent("error", "locations/list failed", (n == null ? void 0 : n.message) || n);
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
  /**
   * Render rename conflict notification banner
   */
  _renderEmptyStateBanner() {
    var i;
    const t = (i = this.hass) == null ? void 0 : i.navigate;
    return m`
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
    return m`
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
      var r;
      try {
        const s = i ? "lock" : "unlock";
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: s,
          service_data: this._serviceDataWithEntryId({
            location_id: e,
            source_id: "manual_ui"
          })
        }), this._logEvent("ui", s, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1;
        const c = ((r = this._locations.find((d) => d.id === e)) == null ? void 0 : r.name) || e;
        this._showToast(`${i ? "Locked" : "Unlocked"} "${c}"`, "success");
      } catch (s) {
        console.error("Failed to toggle lock:", s), this._showToast((s == null ? void 0 : s.message) || "Failed to update lock", "error");
      }
    });
  }
  _getLocationLockState(t) {
    var i;
    const e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const o of Object.values(e)) {
      const n = (o == null ? void 0 : o.attributes) || {};
      if ((n == null ? void 0 : n.device_class) !== "occupancy" || String(n == null ? void 0 : n.location_id) !== String(t)) continue;
      const r = Array.isArray(n == null ? void 0 : n.locked_by) ? n.locked_by.map((s) => String(s)) : [];
      return {
        isLocked: !!(n != null && n.is_locked),
        lockedBy: r
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
      var u, l;
      const r = this._locations.find((h) => h.id === e), s = (r == null ? void 0 : r.name) || e, { isLocked: c, lockedBy: d } = this._getLocationLockState(e);
      if (c) {
        const h = d.length ? ` (${d.join(", ")})` : "";
        this._showToast(`Hey, can't do it. "${s}" is locked${h}.`, "warning");
        return;
      }
      try {
        if (!r) {
          this._showToast("Invalid occupancy request", "error");
          return;
        }
        const h = i ? "trigger" : "vacate_area", f = {
          location_id: e,
          source_id: "manual_ui"
        };
        if (i) {
          const p = (l = (u = r.modules) == null ? void 0 : u.occupancy) == null ? void 0 : l.default_timeout;
          typeof p == "number" && p >= 0 && (f.timeout = Math.floor(p));
        } else
          f.include_locked = !1;
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: h,
          service_data: this._serviceDataWithEntryId(f)
        }), this._logEvent("ui", h, { locationId: e, source_id: "manual_ui" }), await this._loadLocations(!0), this._locationsVersion += 1, this._showToast(
          i ? `Marked "${s}" as occupied` : `Marked "${s}" as unoccupied (vacated)`,
          "success"
        );
      } catch (h) {
        console.error("Failed to toggle occupancy:", h), this._showToast((h == null ? void 0 : h.message) || "Hey, can't do it.", "error");
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
        const n = this._selectedId === e.id, r = e.parent_id ?? void 0;
        if (await this.hass.callWS(
          this._withEntryId({
            type: "topomation/locations/delete",
            location_id: e.id
          })
        ), await this._loadLocations(!0), this._locationsVersion += 1, n) {
          const s = (r && this._locations.some((c) => c.id === r) ? r : (o = this._locations[0]) == null ? void 0 : o.id) ?? void 0;
          this._selectedId = s;
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
    return Number.isFinite(t) ? Math.min(Ue, Math.max(ze, t)) : Fe;
  }
  _setPanelSplit(t, e = !1) {
    const i = this._clampPanelSplit(t);
    Math.abs(i - this._treePanelSplit) < 1e-3 || (this._treePanelSplit = i, e && this._persistPanelSplitPreference());
  }
  _restorePanelSplitPreference() {
    var t;
    try {
      const e = (t = window.localStorage) == null ? void 0 : t.getItem(Ri);
      if (!e) return;
      const i = Number(e);
      this._setPanelSplit(i);
    } catch {
    }
  }
  _persistPanelSplitPreference() {
    var t;
    try {
      (t = window.localStorage) == null || t.setItem(Ri, this._treePanelSplit.toFixed(4));
    } catch {
    }
  }
  _restoreRightPanelModePreference() {
    var t;
    try {
      const e = (t = window.localStorage) == null ? void 0 : t.getItem(Oi);
      (e === "assign" || e === "inspector") && (this._rightPanelMode = e);
    } catch {
    }
    this._rightPanelMode === "assign" && this._ensureEntityAreaIndex();
  }
  _persistRightPanelModePreference() {
    var t;
    try {
      (t = window.localStorage) == null || t.setItem(Oi, this._rightPanelMode);
    } catch {
    }
  }
  _handleRightPanelModeChange(t) {
    this._rightPanelMode !== t && (this._rightPanelMode = t, this._persistRightPanelModePreference(), t === "assign" && this._ensureEntityAreaIndex());
  }
  _applyPanelSplitFromClientX(t, e = !1) {
    var r;
    const i = (r = this.shadowRoot) == null ? void 0 : r.querySelector(".panel-container");
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
      this._unsubUpdates && (this._unsubUpdates(), this._unsubUpdates = void 0), this._unsubStateChanged && (this._unsubStateChanged(), this._unsubStateChanged = void 0), this._unsubOccupancyChanged && (this._unsubOccupancyChanged(), this._unsubOccupancyChanged = void 0), this._unsubActionsSummary && (this._unsubActionsSummary(), this._unsubActionsSummary = void 0), this._unsubEntityRegistryUpdated && (this._unsubEntityRegistryUpdated(), this._unsubEntityRegistryUpdated = void 0), this._unsubDeviceRegistryUpdated && (this._unsubDeviceRegistryUpdated(), this._unsubDeviceRegistryUpdated = void 0), this._unsubAreaRegistryUpdated && (this._unsubAreaRegistryUpdated(), this._unsubAreaRegistryUpdated = void 0);
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
            var o, n;
            const e = (o = t == null ? void 0 : t.data) == null ? void 0 : o.location_id, i = (n = t == null ? void 0 : t.data) == null ? void 0 : n.occupied;
            !e || typeof i != "boolean" || (this._setOccupancyState(e, i), this._logEvent("ha", "topomation_occupancy_changed", { locationId: e, occupied: i }));
          },
          "topomation_occupancy_changed"
        );
      } catch (t) {
        console.warn("Failed to subscribe to topomation_occupancy_changed events", t), this._logEvent("error", "subscribe failed: topomation_occupancy_changed", String(t));
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
  _setOccupancyState(t, e) {
    this._occupancyStateByLocation = {
      ...this._occupancyStateByLocation,
      [t]: e
    };
  }
  _buildOccupancyStateMapFromStates() {
    var i;
    const t = {}, e = ((i = this.hass) == null ? void 0 : i.states) || {};
    for (const o of Object.values(e)) {
      const n = (o == null ? void 0 : o.attributes) || {};
      if ((n == null ? void 0 : n.device_class) !== "occupancy") continue;
      const r = n.location_id;
      r && (t[r] = (o == null ? void 0 : o.state) === "on");
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
              var c, d, u, l, h, f;
              const i = (c = e == null ? void 0 : e.data) == null ? void 0 : c.entity_id;
              if (!i) return;
              const o = (d = e == null ? void 0 : e.data) == null ? void 0 : d.new_state, n = (o == null ? void 0 : o.attributes) || {};
              if (i.startsWith("binary_sensor.") && n.device_class === "occupancy" && n.location_id && this._setOccupancyState(n.location_id, (o == null ? void 0 : o.state) === "on"), !this._shouldTrackEntity(i)) return;
              const r = (l = (u = e == null ? void 0 : e.data) == null ? void 0 : u.new_state) == null ? void 0 : l.state, s = (f = (h = e == null ? void 0 : e.data) == null ? void 0 : h.old_state) == null ? void 0 : f.state;
              this._logEvent("ha", "state_changed", { entityId: i, oldState: s, newState: r });
            },
            "state_changed"
          );
        } catch (e) {
          console.warn("Failed to subscribe to state_changed events", e), this._logEvent("error", "subscribe failed: state_changed", String(e));
        }
    }
  }
  _renderEventLog() {
    return m`
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
          ${this._eventLogEntries.length === 0 ? m`<div class="event-log-item event-log-meta">No events captured yet.</div>` : this._eventLogEntries.map(
      (t) => m`
                  <div class="event-log-item">
                    <div class="event-log-meta">[${t.ts}] ${t.type}</div>
                    <div>${t.message}</div>
                    ${t.data !== void 0 ? m`<div class="event-log-meta">${this._safeStringify(t.data)}</div>` : ""}
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
      for (const s of n.entity_ids || []) e.add(s);
      const r = ((o = (i = n.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || [];
      for (const s of r) e.add(s.entity_id);
    }
    return e.has(t);
  }
  _isTrackedEntityInSelectedSubtree(t) {
    var i, o;
    const e = this._getSelectedSubtreeLocationIds();
    if (e.size === 0) return !1;
    for (const n of this._locations) {
      if (!e.has(n.id)) continue;
      if ((n.entity_ids || []).includes(t) || (((o = (i = n.modules) == null ? void 0 : i.occupancy) == null ? void 0 : o.occupancy_sources) || []).some((s) => s.entity_id === t)) return !0;
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
    i.length === 0 ? (this._pendingChanges.clear(), this._showToast("All changes saved successfully", "success")) : i.length < e.length ? (this._showToast(`Saved ${e.length - i.length} changes, ${i.length} failed`, "warning"), t.forEach(([o, n], r) => {
      e[r].status === "fulfilled" && this._pendingChanges.delete(o);
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
    var o, n, r, s;
    const t = (n = (o = this.panel) == null ? void 0 : o.config) == null ? void 0 : n.entry_id;
    if (typeof t == "string" && t.trim()) {
      const c = t.trim();
      return this._lastKnownEntryId = c, c;
    }
    const e = (s = (r = this.route) == null ? void 0 : r.path) == null ? void 0 : s.split("?", 2)[1];
    if (e) {
      const c = new URLSearchParams(e).get("entry_id");
      if (c && c.trim()) {
        const d = c.trim();
        return this._lastKnownEntryId = d, d;
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
};
be.properties = {
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
  _treePanelSplit: { state: !0 },
  _isResizingPanels: { state: !0 },
  _entityAreaById: { state: !0 },
  _entitySearch: { state: !0 },
  _assignBusyByEntityId: { state: !0 },
  _rightPanelMode: { state: !0 },
  _assignmentFilter: { state: !0 },
  _deviceGroupExpanded: { state: !0 },
  _haRegistryRevision: { state: !0 }
}, be.styles = [
  xe,
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
let Je = be;
if (!customElements.get("topomation-panel"))
  try {
    customElements.define("topomation-panel", Je);
  } catch (a) {
    console.error("[topomation-panel] failed to define element", a);
  }
export {
  Je as TopomationPanel
};
