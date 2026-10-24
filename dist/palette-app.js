// \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), l = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.iterator;
	function m(e) {
		return typeof e != "object" || !e ? null : (e = p && e[p] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var h = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, g = Object.assign, _ = {};
	function v(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	v.prototype.isReactComponent = {}, v.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, v.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function y() {}
	y.prototype = v.prototype;
	function b(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	var x = b.prototype = new y();
	x.constructor = b, g(x, v.prototype), x.isPureReactComponent = !0;
	var S = Array.isArray;
	function C() {}
	var w = {
		H: null,
		A: null,
		T: null,
		S: null
	}, T = Object.prototype.hasOwnProperty;
	function ee(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function E(e, t) {
		return ee(e.type, t, e.props);
	}
	function D(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function te(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var O = /\/+/g;
	function ne(e, t) {
		return typeof e == "object" && e && e.key != null ? te("" + e.key) : t.toString(36);
	}
	function k(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(C, C) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function re(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, re(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + ne(e, 0) : a, S(o) ? (i = "", c != null && (i = c.replace(O, "$&/") + "/"), re(o, r, i, "", function(e) {
			return e;
		})) : o != null && (D(o) && (o = E(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(O, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (S(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + ne(a, u), c += re(a, r, i, s, o);
		else if (u = m(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + ne(a, u++), c += re(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return re(k(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function ie(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return re(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function ae(e) {
		if (e._status === -1) {
			var t = e._result;
			t = t(), t.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t);
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t);
			}), e._status === -1 && (e._status = 0, e._result = t);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var A = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, j = {
		map: ie,
		forEach: function(e, t, n) {
			ie(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return ie(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return ie(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!D(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = j, e.Component = v, e.Fragment = r, e.Profiler = a, e.PureComponent = b, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = w, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return w.H.useMemoCache(e);
		}
	}, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = g({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !T.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return ee(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) T.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return ee(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = D, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: ae
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = w.T, n = {};
		w.T = n;
		try {
			var r = e(), i = w.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(C, A);
		} catch (e) {
			A(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), w.T = t;
		}
	}, e.unstable_useCacheRefresh = function() {
		return w.H.useCacheRefresh();
	}, e.use = function(e) {
		return w.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return w.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return w.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return w.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return w.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return w.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return w.H.useEffectEvent(e);
	}, e.useId = function() {
		return w.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return w.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return w.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return w.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return w.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return w.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return w.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return w.H.useRef(e);
	}, e.useState = function(e) {
		return w.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return w.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return w.H.useTransition();
	}, e.version = "19.2.8";
})), u = /* @__PURE__ */ o(((e, t) => {
	t.exports = l();
})), d = /* @__PURE__ */ o(((e) => {
	var t = u();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var i = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, a = Symbol.for("react.portal");
	function o(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: a,
			key: r == null ? null : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var s = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function c(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return o(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = s.T, n = i.p;
		try {
			if (s.T = null, i.p = 2, e) return e();
		} finally {
			s.T = t, i.p = n, i.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, i.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && i.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin), a = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? i.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o
			}) : n === "script" && i.d.X(e, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") {
			if (typeof t == "object" && t) {
				if (t.as == null || t.as === "script") {
					var n = c(t.as, t.crossOrigin);
					i.d.M(e, {
						crossOrigin: n,
						integrity: typeof t.integrity == "string" ? t.integrity : void 0,
						nonce: typeof t.nonce == "string" ? t.nonce : void 0
					});
				}
			} else t ?? i.d.M(e);
		}
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin);
			i.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") {
			if (t) {
				var n = c(t.as, t.crossOrigin);
				i.d.m(e, {
					as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0
				});
			} else i.d.m(e);
		}
	}, e.requestFormReset = function(e) {
		i.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return s.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return s.H.useHostTransitionStatus();
	}, e.version = "19.2.8";
})), f = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = d();
})), p = /* @__PURE__ */ o(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function x(e) {
		if (h = !1, b(e), !m) {
			if (n(c) !== null) m = !0, S || (S = !0, D());
			else {
				var t = n(l);
				t !== null && ne(x, t.startTime - e);
			}
		}
	}
	var S = !1, C = -1, w = 5, T = -1;
	function ee() {
		return g ? !0 : !(e.unstable_now() - T < w);
	}
	function E() {
		if (g = !1, S) {
			var t = e.unstable_now();
			T = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(C), C = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && ee());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && ne(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? D() : S = !1;
			}
		}
	}
	var D;
	if (typeof y == "function") D = function() {
		y(E);
	};
	else if (typeof MessageChannel < "u") {
		var te = new MessageChannel(), O = te.port2;
		te.port1.onmessage = E, D = function() {
			O.postMessage(null);
		};
	} else D = function() {
		_(E, 0);
	};
	function ne(t, n) {
		C = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : w = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(C), C = -1) : h = !0, ne(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, D()))), r;
	}, e.unstable_shouldYield = ee, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), m = /* @__PURE__ */ o(((e, t) => {
	t.exports = p();
})), h = /* @__PURE__ */ o(((e) => {
	var t = m(), n = u(), r = f();
	function i(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function a(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function o(e) {
		var t = e, n = e;
		if (e.alternate) for (; t.return;) t = t.return;
		else {
			e = t;
			do
				t = e, t.flags & 4098 && (n = t.return), e = t.return;
			while (e);
		}
		return t.tag === 3 ? n : null;
	}
	function s(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function c(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function l(e) {
		if (o(e) !== e) throw Error(i(188));
	}
	function d(e) {
		var t = e.alternate;
		if (!t) {
			if (t = o(e), t === null) throw Error(i(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var a = n.return;
			if (a === null) break;
			var s = a.alternate;
			if (s === null) {
				if (r = a.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (a.child === s.child) {
				for (s = a.child; s;) {
					if (s === n) return l(a), e;
					if (s === r) return l(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var c = !1, u = a.child; u;) {
					if (u === n) {
						c = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						c = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!c) {
					for (u = s.child; u;) {
						if (u === n) {
							c = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							c = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!c) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function p(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = p(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var h = Object.assign, g = Symbol.for("react.element"), _ = Symbol.for("react.transitional.element"), v = Symbol.for("react.portal"), y = Symbol.for("react.fragment"), b = Symbol.for("react.strict_mode"), x = Symbol.for("react.profiler"), S = Symbol.for("react.consumer"), C = Symbol.for("react.context"), w = Symbol.for("react.forward_ref"), T = Symbol.for("react.suspense"), ee = Symbol.for("react.suspense_list"), E = Symbol.for("react.memo"), D = Symbol.for("react.lazy"), te = Symbol.for("react.activity"), O = Symbol.for("react.memo_cache_sentinel"), ne = Symbol.iterator;
	function k(e) {
		return typeof e != "object" || !e ? null : (e = ne && e[ne] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var re = Symbol.for("react.client.reference");
	function ie(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === re ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case y: return "Fragment";
			case x: return "Profiler";
			case b: return "StrictMode";
			case T: return "Suspense";
			case ee: return "SuspenseList";
			case te: return "Activity";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case v: return "Portal";
			case C: return e.displayName || "Context";
			case S: return (e._context.displayName || "Context") + ".Consumer";
			case w:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case E: return t = e.displayName || null, t === null ? ie(e.type) || "Memo" : t;
			case D:
				t = e._payload, e = e._init;
				try {
					return ie(e(t));
				} catch {}
		}
		return null;
	}
	var ae = Array.isArray, A = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, j = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, oe = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, se = [], ce = -1;
	function le(e) {
		return { current: e };
	}
	function M(e) {
		0 > ce || (e.current = se[ce], se[ce] = null, ce--);
	}
	function N(e, t) {
		ce++, se[ce] = e.current, e.current = t;
	}
	var ue = le(null), P = le(null), de = le(null), fe = le(null);
	function pe(e, t) {
		switch (N(de, t), N(P, e), N(ue, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? Vd(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = Vd(t), e = Hd(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		M(ue), N(ue, e);
	}
	function me() {
		M(ue), M(P), M(de);
	}
	function F(e) {
		e.memoizedState !== null && N(fe, e);
		var t = ue.current, n = Hd(t, e.type);
		t !== n && (N(P, e), N(ue, n));
	}
	function I(e) {
		P.current === e && (M(ue), M(P)), fe.current === e && (M(fe), Qf._currentValue = oe);
	}
	var L, he;
	function ge(e) {
		if (L === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			L = t && t[1] || "", he = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + L + e + he;
	}
	var _e = !1;
	function ve(e, t) {
		if (!e || _e) return "";
		_e = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							e.call(n.prototype);
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			_e = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? ge(n) : "";
	}
	function ye(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return ge(e.type);
			case 16: return ge("Lazy");
			case 13: return e.child !== t && t !== null ? ge("Suspense Fallback") : ge("Suspense");
			case 19: return ge("SuspenseList");
			case 0:
			case 15: return ve(e.type, !1);
			case 11: return ve(e.type.render, !1);
			case 1: return ve(e.type, !0);
			case 31: return ge("Activity");
			default: return "";
		}
	}
	function be(e) {
		try {
			var t = "", n = null;
			do
				t += ye(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var xe = Object.prototype.hasOwnProperty, Se = t.unstable_scheduleCallback, Ce = t.unstable_cancelCallback, we = t.unstable_shouldYield, Te = t.unstable_requestPaint, Ee = t.unstable_now, De = t.unstable_getCurrentPriorityLevel, Oe = t.unstable_ImmediatePriority, ke = t.unstable_UserBlockingPriority, Ae = t.unstable_NormalPriority, je = t.unstable_LowPriority, Me = t.unstable_IdlePriority, Ne = t.log, Pe = t.unstable_setDisableYieldValue, Fe = null, Ie = null;
	function Le(e) {
		if (typeof Ne == "function" && Pe(e), Ie && typeof Ie.setStrictMode == "function") try {
			Ie.setStrictMode(Fe, e);
		} catch {}
	}
	var Re = Math.clz32 ? Math.clz32 : Ve, ze = Math.log, Be = Math.LN2;
	function Ve(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (ze(e) / Be | 0) | 0;
	}
	var He = 256, Ue = 262144, We = 4194304;
	function Ge(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & 261888;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function Ke(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = Ge(n))) : i = Ge(o) : i = Ge(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = Ge(n))) : i = Ge(o)) : i = Ge(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function qe(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function Je(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function Ye() {
		var e = We;
		return We <<= 1, !(We & 62914560) && (We = 4194304), e;
	}
	function Xe(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function Ze(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function Qe(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - Re(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && $e(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function $e(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - Re(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function et(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - Re(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function tt(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : nt(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function nt(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function rt(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function it() {
		var e = j.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : mp(e.type)) : e;
	}
	function at(e, t) {
		var n = j.p;
		try {
			return j.p = e, t();
		} finally {
			j.p = n;
		}
	}
	var R = Math.random().toString(36).slice(2), ot = "__reactFiber$" + R, st = "__reactProps$" + R, ct = "__reactContainer$" + R, lt = "__reactEvents$" + R, ut = "__reactListeners$" + R, dt = "__reactHandles$" + R, ft = "__reactResources$" + R, pt = "__reactMarker$" + R;
	function mt(e) {
		delete e[ot], delete e[st], delete e[lt], delete e[ut], delete e[dt];
	}
	function ht(e) {
		var t = e[ot];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[ct] || n[ot]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = df(e); e !== null;) {
					if (n = e[ot]) return n;
					e = df(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function gt(e) {
		if (e = e[ot] || e[ct]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function z(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function _t(e) {
		var t = e[ft];
		return t ||= e[ft] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function vt(e) {
		e[pt] = !0;
	}
	var yt = /* @__PURE__ */ new Set(), bt = {};
	function xt(e, t) {
		St(e, t), St(e + "Capture", t);
	}
	function St(e, t) {
		for (bt[e] = t, e = 0; e < t.length; e++) yt.add(t[e]);
	}
	var Ct = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), B = {}, wt = {};
	function Tt(e) {
		return xe.call(wt, e) ? !0 : xe.call(B, e) ? !1 : Ct.test(e) ? wt[e] = !0 : (B[e] = !0, !1);
	}
	function Et(e, t, n) {
		if (Tt(t)) {
			if (n === null) e.removeAttribute(t);
			else {
				switch (typeof n) {
					case "undefined":
					case "function":
					case "symbol":
						e.removeAttribute(t);
						return;
					case "boolean":
						var r = t.toLowerCase().slice(0, 5);
						if (r !== "data-" && r !== "aria-") {
							e.removeAttribute(t);
							return;
						}
				}
				e.setAttribute(t, "" + n);
			}
		}
	}
	function Dt(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, "" + n);
		}
	}
	function Ot(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, "" + r);
		}
	}
	function kt(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function At(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function jt(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function Mt(e) {
		if (!e._valueTracker) {
			var t = At(e) ? "checked" : "value";
			e._valueTracker = jt(e, t, "" + e[t]);
		}
	}
	function Nt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = At(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	function Pt(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	var Ft = /[\n"\\]/g;
	function It(e) {
		return e.replace(Ft, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function Lt(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + kt(t)) : e.value !== "" + kt(t) && (e.value = "" + kt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : zt(e, o, kt(n)) : zt(e, o, kt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + kt(s) : e.removeAttribute("name");
	}
	function Rt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				Mt(e);
				return;
			}
			n = n == null ? "" : "" + kt(n), t = t == null ? n : "" + kt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), Mt(e);
	}
	function zt(e, t, n) {
		t === "number" && Pt(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n);
	}
	function Bt(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + kt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Vt(e, t, n) {
		t != null && (t = "" + kt(t), t !== e.value && (e.value = t), n == null) ? e.defaultValue !== t && (e.defaultValue = t) : e.defaultValue = n == null ? "" : "" + kt(n);
	}
	function V(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (ae(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = kt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), Mt(e);
	}
	function Ht(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var H = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function Ut(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || H.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function Wt(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "");
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && Ut(e, a, r);
		} else for (var o in t) t.hasOwnProperty(o) && Ut(e, o, t[o]);
	}
	function Gt(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var Kt = /* @__PURE__ */ new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), qt = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function Jt(e) {
		return qt.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function Yt() {}
	var Xt = null;
	function Zt(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var Qt = null, $t = null;
	function en(e) {
		var t = gt(e);
		if (t && (e = t.stateNode)) {
			var n = e[st] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (Lt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + It("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[st] || null;
								if (!a) throw Error(i(90));
								Lt(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Nt(r);
					}
					break a;
				case "textarea":
					Vt(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && Bt(e, !!n.multiple, t, !1);
			}
		}
	}
	var tn = !1;
	function nn(e, t, n) {
		if (tn) return e(t, n);
		tn = !0;
		try {
			return e(t);
		} finally {
			if (tn = !1, (Qt !== null || $t !== null) && (yu(), Qt && (t = Qt, e = $t, $t = Qt = null, en(t), e))) for (t = 0; t < e.length; t++) en(e[t]);
		}
	}
	function rn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[st] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(i(231, t, typeof n));
		return n;
	}
	var an = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, on = !1;
	if (an) try {
		var sn = {};
		Object.defineProperty(sn, "passive", { get: function() {
			on = !0;
		} }), window.addEventListener("test", sn, sn), window.removeEventListener("test", sn, sn);
	} catch {
		on = !1;
	}
	var cn = null, ln = null, un = null;
	function dn() {
		if (un) return un;
		var e, t = ln, n = t.length, r, i = "value" in cn ? cn.value : cn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return un = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function fn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function pn() {
		return !0;
	}
	function mn() {
		return !1;
	}
	function hn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? pn : mn, this.isPropagationStopped = mn, this;
		}
		return h(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = pn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = pn);
			},
			persist: function() {},
			isPersistent: pn
		}), t;
	}
	var gn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, _n = hn(gn), vn = h({}, gn, {
		view: 0,
		detail: 0
	}), yn = hn(vn), bn, xn, Sn, Cn = h({}, vn, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: Pn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== Sn && (Sn && e.type === "mousemove" ? (bn = e.screenX - Sn.screenX, xn = e.screenY - Sn.screenY) : xn = bn = 0, Sn = e), bn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : xn;
		}
	}), wn = hn(Cn), Tn = hn(h({}, Cn, { dataTransfer: 0 })), En = hn(h({}, vn, { relatedTarget: 0 })), Dn = hn(h({}, gn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), On = hn(h({}, gn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), kn = hn(h({}, gn, { data: 0 })), An = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, jn = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, Mn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Nn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Mn[e]) ? !!t[e] : !1;
	}
	function Pn() {
		return Nn;
	}
	var Fn = hn(h({}, vn, {
		key: function(e) {
			if (e.key) {
				var t = An[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = fn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? jn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Pn,
		charCode: function(e) {
			return e.type === "keypress" ? fn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? fn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), In = hn(h({}, Cn, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), Ln = hn(h({}, vn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Pn
	})), Rn = hn(h({}, gn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), zn = hn(h({}, Cn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Bn = hn(h({}, gn, {
		newState: 0,
		oldState: 0
	})), Vn = [
		9,
		13,
		27,
		32
	], Hn = an && "CompositionEvent" in window, Un = null;
	an && "documentMode" in document && (Un = document.documentMode);
	var Wn = an && "TextEvent" in window && !Un, Gn = an && (!Hn || Un && 8 < Un && 11 >= Un), Kn = " ", qn = !1;
	function Jn(e, t) {
		switch (e) {
			case "keyup": return Vn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function Yn(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var Xn = !1;
	function Zn(e, t) {
		switch (e) {
			case "compositionend": return Yn(t);
			case "keypress": return t.which === 32 ? (qn = !0, Kn) : null;
			case "textInput": return e = t.data, e === Kn && qn ? null : e;
			default: return null;
		}
	}
	function Qn(e, t) {
		if (Xn) return e === "compositionend" || !Hn && Jn(e, t) ? (e = dn(), un = ln = cn = null, Xn = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Gn && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var $n = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function er(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!$n[e.type] : t === "textarea";
	}
	function tr(e, t, n, r) {
		Qt ? $t ? $t.push(r) : $t = [r] : Qt = r, t = Td(t, "onChange"), 0 < t.length && (n = new _n("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var nr = null, rr = null;
	function ir(e) {
		vd(e, 0);
	}
	function ar(e) {
		if (Nt(z(e))) return e;
	}
	function or(e, t) {
		if (e === "change") return t;
	}
	var sr = !1;
	if (an) {
		var cr;
		if (an) {
			var lr = "oninput" in document;
			if (!lr) {
				var ur = document.createElement("div");
				ur.setAttribute("oninput", "return;"), lr = typeof ur.oninput == "function";
			}
			cr = lr;
		} else cr = !1;
		sr = cr && (!document.documentMode || 9 < document.documentMode);
	}
	function dr() {
		nr && (nr.detachEvent("onpropertychange", fr), rr = nr = null);
	}
	function fr(e) {
		if (e.propertyName === "value" && ar(rr)) {
			var t = [];
			tr(t, rr, e, Zt(e)), nn(ir, t);
		}
	}
	function pr(e, t, n) {
		e === "focusin" ? (dr(), nr = t, rr = n, nr.attachEvent("onpropertychange", fr)) : e === "focusout" && dr();
	}
	function mr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return ar(rr);
	}
	function hr(e, t) {
		if (e === "click") return ar(t);
	}
	function gr(e, t) {
		if (e === "input" || e === "change") return ar(t);
	}
	function _r(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var vr = typeof Object.is == "function" ? Object.is : _r;
	function yr(e, t) {
		if (vr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!xe.call(t, i) || !vr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function br(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function xr(e, t) {
		var n = br(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = br(n);
		}
	}
	function Sr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Sr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Cr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Pt(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Pt(e.document);
		}
		return t;
	}
	function wr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Tr = an && "documentMode" in document && 11 >= document.documentMode, Er = null, Dr = null, Or = null, kr = !1;
	function Ar(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		kr || Er == null || Er !== Pt(r) || (r = Er, "selectionStart" in r && wr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Or && yr(Or, r) || (Or = r, r = Td(Dr, "onSelect"), 0 < r.length && (t = new _n("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Er)));
	}
	function jr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Mr = {
		animationend: jr("Animation", "AnimationEnd"),
		animationiteration: jr("Animation", "AnimationIteration"),
		animationstart: jr("Animation", "AnimationStart"),
		transitionrun: jr("Transition", "TransitionRun"),
		transitionstart: jr("Transition", "TransitionStart"),
		transitioncancel: jr("Transition", "TransitionCancel"),
		transitionend: jr("Transition", "TransitionEnd")
	}, Nr = {}, Pr = {};
	an && (Pr = document.createElement("div").style, "AnimationEvent" in window || (delete Mr.animationend.animation, delete Mr.animationiteration.animation, delete Mr.animationstart.animation), "TransitionEvent" in window || delete Mr.transitionend.transition);
	function Fr(e) {
		if (Nr[e]) return Nr[e];
		if (!Mr[e]) return e;
		var t = Mr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Pr) return Nr[e] = t[n];
		return e;
	}
	var Ir = Fr("animationend"), Lr = Fr("animationiteration"), Rr = Fr("animationstart"), zr = Fr("transitionrun"), Br = Fr("transitionstart"), Vr = Fr("transitioncancel"), Hr = Fr("transitionend"), Ur = /* @__PURE__ */ new Map(), Wr = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	Wr.push("scrollEnd");
	function Gr(e, t) {
		Ur.set(e, t), xt(t, [e]);
	}
	var Kr = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, qr = [], Jr = 0, Yr = 0;
	function Xr() {
		for (var e = Jr, t = Yr = Jr = 0; t < e;) {
			var n = qr[t];
			qr[t++] = null;
			var r = qr[t];
			qr[t++] = null;
			var i = qr[t];
			qr[t++] = null;
			var a = qr[t];
			if (qr[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && ei(n, i, a);
		}
	}
	function Zr(e, t, n, r) {
		qr[Jr++] = e, qr[Jr++] = t, qr[Jr++] = n, qr[Jr++] = r, Yr |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function Qr(e, t, n, r) {
		return Zr(e, t, n, r), ti(e);
	}
	function $r(e, t) {
		return Zr(e, null, null, t), ti(e);
	}
	function ei(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - Re(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function ti(e) {
		if (50 < du) throw du = 0, fu = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var ni = {};
	function ri(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function ii(e, t, n, r) {
		return new ri(e, t, n, r);
	}
	function ai(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function oi(e, t) {
		var n = e.alternate;
		return n === null ? (n = ii(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 65011712, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function si(e, t) {
		e.flags &= 65011714;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function ci(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof e == "function") ai(e) && (s = 1);
		else if (typeof e == "string") s = Uf(e, n, ue.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (e) {
			case te: return e = ii(31, n, t, a), e.elementType = te, e.lanes = o, e;
			case y: return li(n.children, a, o, t);
			case b:
				s = 8, a |= 24;
				break;
			case x: return e = ii(12, n, t, a | 2), e.elementType = x, e.lanes = o, e;
			case T: return e = ii(13, n, t, a), e.elementType = T, e.lanes = o, e;
			case ee: return e = ii(19, n, t, a), e.elementType = ee, e.lanes = o, e;
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case C:
						s = 10;
						break a;
					case S:
						s = 9;
						break a;
					case w:
						s = 11;
						break a;
					case E:
						s = 14;
						break a;
					case D:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = ii(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function li(e, t, n, r) {
		return e = ii(7, e, r, t), e.lanes = n, e;
	}
	function ui(e, t, n) {
		return e = ii(6, e, null, t), e.lanes = n, e;
	}
	function di(e) {
		var t = ii(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function fi(e, t, n) {
		return t = ii(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var pi = /* @__PURE__ */ new WeakMap();
	function mi(e, t) {
		if (typeof e == "object" && e) {
			var n = pi.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: be(t)
			}, pi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: be(t)
		};
	}
	var hi = [], gi = 0, _i = null, vi = 0, yi = [], bi = 0, xi = null, Si = 1, Ci = "";
	function wi(e, t) {
		hi[gi++] = vi, hi[gi++] = _i, _i = e, vi = t;
	}
	function Ti(e, t, n) {
		yi[bi++] = Si, yi[bi++] = Ci, yi[bi++] = xi, xi = e;
		var r = Si;
		e = Ci;
		var i = 32 - Re(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - Re(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Si = 1 << 32 - Re(t) + i | n << i | r, Ci = a + e;
		} else Si = 1 << a | n << i | r, Ci = e;
	}
	function Ei(e) {
		e.return !== null && (wi(e, 1), Ti(e, 1, 0));
	}
	function Di(e) {
		for (; e === _i;) _i = hi[--gi], hi[gi] = null, vi = hi[--gi], hi[gi] = null;
		for (; e === xi;) xi = yi[--bi], yi[bi] = null, Ci = yi[--bi], yi[bi] = null, Si = yi[--bi], yi[bi] = null;
	}
	function Oi(e, t) {
		yi[bi++] = Si, yi[bi++] = Ci, yi[bi++] = xi, Si = t.id, Ci = t.overflow, xi = e;
	}
	var ki = null, Ai = null, U = !1, ji = null, Mi = !1, Ni = Error(i(519));
	function Pi(e) {
		throw Bi(mi(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), Ni;
	}
	function Fi(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[ot] = e, t[st] = r, n) {
			case "dialog":
				$("cancel", t), $("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				$("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < gd.length; n++) $(gd[n], t);
				break;
			case "source":
				$("error", t);
				break;
			case "img":
			case "image":
			case "link":
				$("error", t), $("load", t);
				break;
			case "details":
				$("toggle", t);
				break;
			case "input":
				$("invalid", t), Rt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				$("invalid", t);
				break;
			case "textarea": $("invalid", t), V(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || jd(t.textContent, n) ? (r.popover != null && ($("beforetoggle", t), $("toggle", t)), r.onScroll != null && $("scroll", t), r.onScrollEnd != null && $("scrollend", t), r.onClick != null && (t.onclick = Yt), t = !0) : t = !1, t || Pi(e, !0);
	}
	function Ii(e) {
		for (ki = e.return; ki;) switch (ki.tag) {
			case 5:
			case 31:
			case 13:
				Mi = !1;
				return;
			case 27:
			case 3:
				Mi = !0;
				return;
			default: ki = ki.return;
		}
	}
	function Li(e) {
		if (e !== ki) return !1;
		if (!U) return Ii(e), U = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || Ud(e.type, e.memoizedProps)), n = !n), n && Ai && Pi(e), Ii(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Ai = uf(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Ai = uf(e);
		} else t === 27 ? (t = Ai, Zd(e.type) ? (e = lf, lf = null, Ai = e) : Ai = t) : Ai = ki ? cf(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Ri() {
		Ai = ki = null, U = !1;
	}
	function zi() {
		var e = ji;
		return e !== null && (Zl === null ? Zl = e : Zl.push.apply(Zl, e), ji = null), e;
	}
	function Bi(e) {
		ji === null ? ji = [e] : ji.push(e);
	}
	var Vi = le(null), Hi = null, Ui = null;
	function Wi(e, t, n) {
		N(Vi, t._currentValue), t._currentValue = n;
	}
	function Gi(e) {
		e._currentValue = Vi.current, M(Vi);
	}
	function Ki(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function qi(e, t, n, r) {
		var a = e.child;
		for (a !== null && (a.return = e); a !== null;) {
			var o = a.dependencies;
			if (o !== null) {
				var s = a.child;
				o = o.firstContext;
				a: for (; o !== null;) {
					var c = o;
					o = a;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), Ki(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), Ki(s, n, e), s = null;
			} else s = a.child;
			if (s !== null) s.return = a;
			else for (s = a; s !== null;) {
				if (s === e) {
					s = null;
					break;
				}
				if (a = s.sibling, a !== null) {
					a.return = s.return, s = a;
					break;
				}
				s = s.return;
			}
			a = s;
		}
	}
	function Ji(e, t, n, r) {
		e = null;
		for (var a = t, o = !1; a !== null;) {
			if (!o) {
				if (a.flags & 524288) o = !0;
				else if (a.flags & 262144) break;
			}
			if (a.tag === 10) {
				var s = a.alternate;
				if (s === null) throw Error(i(387));
				if (s = s.memoizedProps, s !== null) {
					var c = a.type;
					vr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === fe.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [Qf] : e.push(Qf));
			}
			a = a.return;
		}
		e !== null && qi(t, e, n, r), t.flags |= 262144;
	}
	function Yi(e) {
		for (e = e.firstContext; e !== null;) {
			if (!vr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function Xi(e) {
		Hi = e, Ui = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function Zi(e) {
		return $i(Hi, e);
	}
	function Qi(e, t) {
		return Hi === null && Xi(e), $i(e, t);
	}
	function $i(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, Ui === null) {
			if (e === null) throw Error(i(308));
			Ui = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else Ui = Ui.next = t;
		return n;
	}
	var ea = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, ta = t.unstable_scheduleCallback, na = t.unstable_NormalPriority, ra = {
		$$typeof: C,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function ia() {
		return {
			controller: new ea(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function aa(e) {
		e.refCount--, e.refCount === 0 && ta(na, function() {
			e.controller.abort();
		});
	}
	var oa = null, sa = 0, ca = 0, la = null;
	function ua(e, t) {
		if (oa === null) {
			var n = oa = [];
			sa = 0, ca = ud(), la = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return sa++, t.then(da, da), t;
	}
	function da() {
		if (--sa === 0 && oa !== null) {
			la !== null && (la.status = "fulfilled");
			var e = oa;
			oa = null, ca = 0, la = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function fa(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var pa = A.S;
	A.S = function(e, t) {
		eu = Ee(), typeof t == "object" && t && typeof t.then == "function" && ua(e, t), pa !== null && pa(e, t);
	};
	var ma = le(null);
	function ha() {
		var e = ma.current;
		return e === null ? Rl.pooledCache : e;
	}
	function ga(e, t) {
		t === null ? N(ma, ma.current) : N(ma, t.pool);
	}
	function _a() {
		var e = ha();
		return e === null ? null : {
			parent: ra._currentValue,
			pool: e
		};
	}
	var va = Error(i(460)), ya = Error(i(474)), ba = Error(i(542)), xa = { then: function() {} };
	function Sa(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function Ca(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(Yt, Yt), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Da(e), e;
			default:
				if (typeof t.status == "string") t.then(Yt, Yt);
				else {
					if (e = Rl, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, Da(e), e;
				}
				throw Ta = t, va;
		}
	}
	function wa(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (Ta = e, va) : e;
		}
	}
	var Ta = null;
	function Ea() {
		if (Ta === null) throw Error(i(459));
		var e = Ta;
		return Ta = null, e;
	}
	function Da(e) {
		if (e === va || e === ba) throw Error(i(483));
	}
	var Oa = null, ka = 0;
	function Aa(e) {
		var t = ka;
		return ka += 1, Oa === null && (Oa = []), Ca(Oa, e, t);
	}
	function ja(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function Ma(e, t) {
		throw t.$$typeof === g ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function Na(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function a(e, t) {
			return e = oi(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 67108866, n) : (r = r.index, r < n ? (t.flags |= 67108866, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 67108866), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = ui(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === y ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === D && wa(i) === t.type) ? (t = a(t, n.props), ja(t, n), t.return = e, t) : (t = ci(n.type, n.key, n.props, null, e.mode, r), ja(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = fi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = li(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = ui("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case _: return n = ci(t.type, t.key, t.props, null, e.mode, n), ja(n, t), n.return = e, n;
					case v: return t = fi(t, e.mode, n), t.return = e, t;
					case D: return t = wa(t), f(e, t, n);
				}
				if (ae(t) || k(t)) return t = li(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Aa(t), n);
				if (t.$$typeof === C) return f(e, Qi(e, t), n);
				Ma(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case _: return n.key === i ? l(e, t, n, r) : null;
					case v: return n.key === i ? u(e, t, n, r) : null;
					case D: return n = wa(n), p(e, t, n, r);
				}
				if (ae(n) || k(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Aa(n), r);
				if (n.$$typeof === C) return p(e, t, Qi(e, n), r);
				Ma(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case _: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case v: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case D: return r = wa(r), m(e, t, n, r, i);
				}
				if (ae(r) || k(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Aa(r), i);
				if (r.$$typeof === C) return m(e, t, n, Qi(t, r), i);
				Ma(t, r);
			}
			return null;
		}
		function h(i, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), U && wi(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return U && wi(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), U && wi(i, h), l;
		}
		function g(a, s, c, l) {
			if (c == null) throw Error(i(151));
			for (var u = null, d = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), U && wi(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return U && wi(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), U && wi(a, g), u;
		}
		function b(e, r, o, c) {
			if (typeof o == "object" && o && o.type === y && o.key === null && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case _:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === y) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === D && wa(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), ja(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === y ? (c = li(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = ci(o.type, o.key, o.props, null, e.mode, c), ja(c, o), c.return = e, e = c);
						}
						return s(e);
					case v:
						a: {
							for (l = o.key; r !== null;) {
								if (r.key === l) {
									if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
										n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							c = fi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case D: return o = wa(o), b(e, r, o, c);
				}
				if (ae(o)) return h(e, r, o, c);
				if (k(o)) {
					if (l = k(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return b(e, r, Aa(o), c);
				if (o.$$typeof === C) return b(e, r, Qi(e, o), c);
				Ma(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = ui(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				ka = 0;
				var i = b(e, t, n, r);
				return Oa = null, i;
			} catch (t) {
				if (t === va || t === ba) throw t;
				var a = ii(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var Pa = Na(!0), Fa = Na(!1), Ia = !1;
	function La(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function Ra(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function za(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function Ba(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, q & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = ti(e), ei(e, null, n), t;
		}
		return Zr(e, r, t, n), ti(e);
	}
	function Va(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, et(e, n);
		}
	}
	function Ha(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
		} else e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var Ua = !1;
	function Wa() {
		if (Ua) {
			var e = la;
			if (e !== null) throw e;
		}
	}
	function Ga(e, t, n, r) {
		Ua = !1;
		var i = e.updateQueue;
		Ia = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane & -536870913, p = f !== s.lane;
				if (p ? (Y & f) === f : (r & f) === f) {
					f !== 0 && f === ca && (Ua = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var m = e, g = s;
						f = t;
						var _ = n;
						switch (g.tag) {
							case 1:
								if (m = g.payload, typeof m == "function") {
									d = m.call(_, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = g.payload, f = typeof m == "function" ? m.call(_, d, f) : m, f == null) break a;
								d = h({}, d, f);
								break a;
							case 2: Ia = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, p && (e.flags |= 8192), p = i.callbacks, p === null ? i.callbacks = [f] : p.push(f));
				} else p = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					p = s, s = p.next, p.next = null, i.lastBaseUpdate = p, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), Gl |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function Ka(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function qa(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Ka(n[e], t);
	}
	var Ja = le(null), Ya = le(0);
	function Xa(e, t) {
		e = Ul, N(Ya, e), N(Ja, t), Ul = e | t.baseLanes;
	}
	function Za() {
		N(Ya, Ul), N(Ja, Ja.current);
	}
	function Qa() {
		Ul = Ya.current, M(Ja), M(Ya);
	}
	var $a = le(null), eo = null;
	function to(e) {
		var t = e.alternate;
		N(oo, oo.current & 1), N($a, e), eo === null && (t === null || Ja.current !== null || t.memoizedState !== null) && (eo = e);
	}
	function no(e) {
		N(oo, oo.current), N($a, e), eo === null && (eo = e);
	}
	function ro(e) {
		e.tag === 22 ? (N(oo, oo.current), N($a, e), eo === null && (eo = e)) : io(e);
	}
	function io() {
		N(oo, oo.current), N($a, $a.current);
	}
	function ao(e) {
		M($a), eo === e && (eo = null), M(oo);
	}
	var oo = le(0);
	function so(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || af(n) || of(n))) return t;
			} else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var co = 0, W = null, G = null, lo = null, uo = !1, fo = !1, po = !1, mo = 0, ho = 0, go = null, _o = 0;
	function vo() {
		throw Error(i(321));
	}
	function yo(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!vr(e[n], t[n])) return !1;
		return !0;
	}
	function bo(e, t, n, r, i, a) {
		return co = a, W = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, A.H = e === null || e.memoizedState === null ? Ls : Rs, po = !1, a = n(r, i), po = !1, fo && (a = So(t, n, r, i)), xo(e), a;
	}
	function xo(e) {
		A.H = Is;
		var t = G !== null && G.next !== null;
		if (co = 0, lo = G = W = null, uo = !1, ho = 0, go = null, t) throw Error(i(300));
		e === null || tc || (e = e.dependencies, e !== null && Yi(e) && (tc = !0));
	}
	function So(e, t, n, r) {
		W = e;
		var a = 0;
		do {
			if (fo && (go = null), ho = 0, fo = !1, 25 <= a) throw Error(i(301));
			if (a += 1, lo = G = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			A.H = zs, o = t(n, r);
		} while (fo);
		return o;
	}
	function Co() {
		var e = A.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? Ao(t) : t, e = e.useState()[0], (G === null ? null : G.memoizedState) !== e && (W.flags |= 1024), t;
	}
	function wo() {
		var e = mo !== 0;
		return mo = 0, e;
	}
	function To(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function Eo(e) {
		if (uo) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			uo = !1;
		}
		co = 0, lo = G = W = null, fo = !1, ho = mo = 0, go = null;
	}
	function Do() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return lo === null ? W.memoizedState = lo = e : lo = lo.next = e, lo;
	}
	function Oo() {
		if (G === null) {
			var e = W.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = G.next;
		var t = lo === null ? W.memoizedState : lo.next;
		if (t !== null) lo = t, G = e;
		else {
			if (e === null) throw W.alternate === null ? Error(i(467)) : Error(i(310));
			G = e, e = {
				memoizedState: G.memoizedState,
				baseState: G.baseState,
				baseQueue: G.baseQueue,
				queue: G.queue,
				next: null
			}, lo === null ? W.memoizedState = lo = e : lo = lo.next = e;
		}
		return lo;
	}
	function ko() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function Ao(e) {
		var t = ho;
		return ho += 1, go === null && (go = []), e = Ca(go, e, t), t = W, (lo === null ? t.memoizedState : lo.next) === null && (t = t.alternate, A.H = t === null || t.memoizedState === null ? Ls : Rs), e;
	}
	function jo(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return Ao(e);
			if (e.$$typeof === C) return Zi(e);
		}
		throw Error(i(438, String(e)));
	}
	function Mo(e) {
		var t = null, n = W.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = W.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ??= {
			data: [],
			index: 0
		}, n === null && (n = ko(), W.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = O;
		return t.index++, n;
	}
	function No(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function Po(e) {
		return Fo(Oo(), G, e);
	}
	function Fo(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(i(311));
		r.lastRenderedReducer = n;
		var a = e.baseQueue, o = r.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			t.baseQueue = a = o, r.pending = null;
		}
		if (o = e.baseState, a === null) e.memoizedState = o;
		else {
			t = a.next;
			var c = s = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (co & f) === f : (Y & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === ca && (d = !0);
					else if ((co & p) === p) {
						u = u.next, p === ca && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, W.lanes |= p, Gl |= p;
					f = u.action, po && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, W.lanes |= f, Gl |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !vr(o, e.memoizedState) && (tc = !0, d && (n = la, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function Io(e) {
		var t = Oo(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			vr(o, t.memoizedState) || (tc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function Lo(e, t, n) {
		var r = W, a = Oo(), o = U;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !vr((G || a).memoizedState, n);
		if (s && (a.memoizedState = n, tc = !0), a = a.queue, cs(Bo.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || lo !== null && lo.memoizedState.tag & 1) {
			if (r.flags |= 2048, rs(9, { destroy: void 0 }, zo.bind(null, r, a, n, t), null), Rl === null) throw Error(i(349));
			o || co & 127 || Ro(r, t, n);
		}
		return n;
	}
	function Ro(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = W.updateQueue, t === null ? (t = ko(), W.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function zo(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Vo(t) && Ho(e);
	}
	function Bo(e, t, n) {
		return n(function() {
			Vo(t) && Ho(e);
		});
	}
	function Vo(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !vr(e, n);
		} catch {
			return !0;
		}
	}
	function Ho(e) {
		var t = $r(e, 2);
		t !== null && hu(t, e, 2);
	}
	function Uo(e) {
		var t = Do();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), po) {
				Le(!0);
				try {
					n();
				} finally {
					Le(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: No,
			lastRenderedState: e
		}, t;
	}
	function Wo(e, t, n, r) {
		return e.baseState = n, Fo(e, G, typeof r == "function" ? r : No);
	}
	function Go(e, t, n, r, a) {
		if (Ns(e)) throw Error(i(485));
		if (e = t.action, e !== null) {
			var o = {
				payload: a,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					o.listeners.push(e);
				}
			};
			A.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Ko(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Ko(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = A.T, o = {};
			A.T = o;
			try {
				var s = n(i, r), c = A.S;
				c !== null && c(o, s), qo(e, t, s);
			} catch (n) {
				Yo(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), A.T = a;
			}
		} else try {
			a = n(i, r), qo(e, t, a);
		} catch (n) {
			Yo(e, t, n);
		}
	}
	function qo(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			Jo(e, t, n);
		}, function(n) {
			return Yo(e, t, n);
		}) : Jo(e, t, n);
	}
	function Jo(e, t, n) {
		t.status = "fulfilled", t.value = n, Xo(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Ko(e, n)));
	}
	function Yo(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, Xo(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function Xo(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function Zo(e, t) {
		return t;
	}
	function Qo(e, t) {
		if (U) {
			var n = Rl.formState;
			if (n !== null) {
				a: {
					var r = W;
					if (U) {
						if (Ai) {
							b: {
								for (var i = Ai, a = Mi; i.nodeType !== 8;) if (!a || (i = cf(i.nextSibling), i === null)) {
									i = null;
									break b;
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								Ai = cf(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						Pi(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = Do(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Zo,
			lastRenderedState: t
		}, n.queue = r, n = As.bind(null, W, r), r.dispatch = n, r = Uo(!1), a = Ms.bind(null, W, !1, r.queue), r = Do(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = Go.bind(null, W, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function $o(e) {
		return es(Oo(), G, e);
	}
	function es(e, t, n) {
		if (t = Fo(e, t, Zo)[0], e = Po(No)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = Ao(t);
		} catch (e) {
			throw e === va ? ba : e;
		}
		else r = t;
		t = Oo();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (W.flags |= 2048, rs(9, { destroy: void 0 }, ts.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function ts(e, t) {
		e.action = t;
	}
	function ns(e) {
		var t = Oo(), n = G;
		if (n !== null) return es(t, n, e);
		Oo(), t = t.memoizedState, n = Oo();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function rs(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = W.updateQueue, t === null && (t = ko(), W.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function is() {
		return Oo().memoizedState;
	}
	function as(e, t, n, r) {
		var i = Do();
		W.flags |= e, i.memoizedState = rs(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function os(e, t, n, r) {
		var i = Oo();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		G !== null && r !== null && yo(r, G.memoizedState.deps) ? i.memoizedState = rs(t, a, n, r) : (W.flags |= e, i.memoizedState = rs(1 | t, a, n, r));
	}
	function ss(e, t) {
		as(8390656, 8, e, t);
	}
	function cs(e, t) {
		os(2048, 8, e, t);
	}
	function ls(e) {
		W.flags |= 4;
		var t = W.updateQueue;
		if (t === null) t = ko(), W.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function us(e) {
		var t = Oo().memoizedState;
		return ls({
			ref: t,
			nextImpl: e
		}), function() {
			if (q & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function ds(e, t) {
		return os(4, 2, e, t);
	}
	function fs(e, t) {
		return os(4, 4, e, t);
	}
	function ps(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function ms(e, t, n) {
		n = n == null ? null : n.concat([e]), os(4, 4, ps.bind(null, t, e), n);
	}
	function hs() {}
	function gs(e, t) {
		var n = Oo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && yo(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function _s(e, t) {
		var n = Oo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && yo(t, r[1])) return r[0];
		if (r = e(), po) {
			Le(!0);
			try {
				e();
			} finally {
				Le(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function vs(e, t, n) {
		return n === void 0 || co & 1073741824 && !(Y & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = mu(), W.lanes |= e, Gl |= e, n);
	}
	function ys(e, t, n, r) {
		return vr(n, t) ? n : Ja.current === null ? !(co & 42) || co & 1073741824 && !(Y & 261930) ? (tc = !0, e.memoizedState = n) : (e = mu(), W.lanes |= e, Gl |= e, t) : (e = vs(e, n, r), vr(e, t) || (tc = !0), e);
	}
	function bs(e, t, n, r, i) {
		var a = j.p;
		j.p = a !== 0 && 8 > a ? a : 8;
		var o = A.T, s = {};
		A.T = s, Ms(e, !1, t, n);
		try {
			var c = i(), l = A.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? js(e, t, fa(c, r), pu(e)) : js(e, t, r, pu(e));
		} catch (n) {
			js(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, pu());
		} finally {
			j.p = a, o !== null && s.types !== null && (o.types = s.types), A.T = o;
		}
	}
	function xs() {}
	function Ss(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = Cs(e).queue;
		bs(e, a, t, oe, n === null ? xs : function() {
			return ws(e), n(r);
		});
	}
	function Cs(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: oe,
			baseState: oe,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: No,
				lastRenderedState: oe
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: No,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function ws(e) {
		var t = Cs(e);
		t.next === null && (t = e.alternate.memoizedState), js(e, t.next.queue, {}, pu());
	}
	function Ts() {
		return Zi(Qf);
	}
	function Es() {
		return Oo().memoizedState;
	}
	function Ds() {
		return Oo().memoizedState;
	}
	function Os(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = pu();
					e = za(n);
					var r = Ba(t, e, n);
					r !== null && (hu(r, t, n), Va(r, t, n)), t = { cache: ia() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function ks(e, t, n) {
		var r = pu();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Ns(e) ? Ps(t, n) : (n = Qr(e, t, n, r), n !== null && (hu(n, e, r), Fs(n, t, r)));
	}
	function As(e, t, n) {
		js(e, t, n, pu());
	}
	function js(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (Ns(e)) Ps(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, vr(s, o)) return Zr(e, t, i, 0), Rl === null && Xr(), !1;
			} catch {}
			if (n = Qr(e, t, i, r), n !== null) return hu(n, e, r), Fs(n, t, r), !0;
		}
		return !1;
	}
	function Ms(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: ud(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Ns(e)) {
			if (t) throw Error(i(479));
		} else t = Qr(e, n, r, 2), t !== null && hu(t, e, 2);
	}
	function Ns(e) {
		var t = e.alternate;
		return e === W || t !== null && t === W;
	}
	function Ps(e, t) {
		fo = uo = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function Fs(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, et(e, n);
		}
	}
	var Is = {
		readContext: Zi,
		use: jo,
		useCallback: vo,
		useContext: vo,
		useEffect: vo,
		useImperativeHandle: vo,
		useLayoutEffect: vo,
		useInsertionEffect: vo,
		useMemo: vo,
		useReducer: vo,
		useRef: vo,
		useState: vo,
		useDebugValue: vo,
		useDeferredValue: vo,
		useTransition: vo,
		useSyncExternalStore: vo,
		useId: vo,
		useHostTransitionStatus: vo,
		useFormState: vo,
		useActionState: vo,
		useOptimistic: vo,
		useMemoCache: vo,
		useCacheRefresh: vo
	};
	Is.useEffectEvent = vo;
	var Ls = {
		readContext: Zi,
		use: jo,
		useCallback: function(e, t) {
			return Do().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: Zi,
		useEffect: ss,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), as(4194308, 4, ps.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return as(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			as(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = Do();
			t = t === void 0 ? null : t;
			var r = e();
			if (po) {
				Le(!0);
				try {
					e();
				} finally {
					Le(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = Do();
			if (n !== void 0) {
				var i = n(t);
				if (po) {
					Le(!0);
					try {
						n(t);
					} finally {
						Le(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = ks.bind(null, W, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = Do();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Uo(e);
			var t = e.queue, n = As.bind(null, W, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: hs,
		useDeferredValue: function(e, t) {
			return vs(Do(), e, t);
		},
		useTransition: function() {
			var e = Uo(!1);
			return e = bs.bind(null, W, e.queue, !0, !1), Do().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = W, a = Do();
			if (U) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), Rl === null) throw Error(i(349));
				Y & 127 || Ro(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, ss(Bo.bind(null, r, o, e), [e]), r.flags |= 2048, rs(9, { destroy: void 0 }, zo.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = Do(), t = Rl.identifierPrefix;
			if (U) {
				var n = Ci, r = Si;
				n = (r & ~(1 << 32 - Re(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = mo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = _o++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: Ts,
		useFormState: Qo,
		useActionState: Qo,
		useOptimistic: function(e) {
			var t = Do();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = Ms.bind(null, W, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: Mo,
		useCacheRefresh: function() {
			return Do().memoizedState = Os.bind(null, W);
		},
		useEffectEvent: function(e) {
			var t = Do(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (q & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, Rs = {
		readContext: Zi,
		use: jo,
		useCallback: gs,
		useContext: Zi,
		useEffect: cs,
		useImperativeHandle: ms,
		useInsertionEffect: ds,
		useLayoutEffect: fs,
		useMemo: _s,
		useReducer: Po,
		useRef: is,
		useState: function() {
			return Po(No);
		},
		useDebugValue: hs,
		useDeferredValue: function(e, t) {
			return ys(Oo(), G.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Po(No)[0], t = Oo().memoizedState;
			return [typeof e == "boolean" ? e : Ao(e), t];
		},
		useSyncExternalStore: Lo,
		useId: Es,
		useHostTransitionStatus: Ts,
		useFormState: $o,
		useActionState: $o,
		useOptimistic: function(e, t) {
			return Wo(Oo(), G, e, t);
		},
		useMemoCache: Mo,
		useCacheRefresh: Ds
	};
	Rs.useEffectEvent = us;
	var zs = {
		readContext: Zi,
		use: jo,
		useCallback: gs,
		useContext: Zi,
		useEffect: cs,
		useImperativeHandle: ms,
		useInsertionEffect: ds,
		useLayoutEffect: fs,
		useMemo: _s,
		useReducer: Io,
		useRef: is,
		useState: function() {
			return Io(No);
		},
		useDebugValue: hs,
		useDeferredValue: function(e, t) {
			var n = Oo();
			return G === null ? vs(n, e, t) : ys(n, G.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Io(No)[0], t = Oo().memoizedState;
			return [typeof e == "boolean" ? e : Ao(e), t];
		},
		useSyncExternalStore: Lo,
		useId: Es,
		useHostTransitionStatus: Ts,
		useFormState: ns,
		useActionState: ns,
		useOptimistic: function(e, t) {
			var n = Oo();
			return G === null ? (n.baseState = e, [e, n.queue.dispatch]) : Wo(n, G, e, t);
		},
		useMemoCache: Mo,
		useCacheRefresh: Ds
	};
	zs.useEffectEvent = us;
	function Bs(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : h({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var Vs = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = pu(), i = za(r);
			i.payload = t, n != null && (i.callback = n), t = Ba(e, i, r), t !== null && (hu(t, e, r), Va(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = pu(), i = za(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Ba(e, i, r), t !== null && (hu(t, e, r), Va(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = pu(), r = za(n);
			r.tag = 2, t != null && (r.callback = t), t = Ba(e, r, n), t !== null && (hu(t, e, n), Va(t, e, n));
		}
	};
	function Hs(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !yr(n, r) || !yr(i, a) : !0;
	}
	function Us(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Vs.enqueueReplaceState(t, t.state, null);
	}
	function Ws(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = h({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function Gs(e) {
		Kr(e);
	}
	function Ks(e) {
		console.error(e);
	}
	function qs(e) {
		Kr(e);
	}
	function Js(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Ys(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Xs(e, t, n) {
		return n = za(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			Js(e, t);
		}, n;
	}
	function Zs(e) {
		return e = za(e), e.tag = 3, e;
	}
	function Qs(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				Ys(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			Ys(t, n, r), typeof i != "function" && (ru === null ? ru = /* @__PURE__ */ new Set([this]) : ru.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function $s(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && Ji(t, n, a, !0), n = $a.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13: return eo === null ? Eu() : n.alternate === null && Wl === 0 && (Wl = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === xa ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), Wu(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === xa ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), Wu(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return Wu(e, r, a), Eu(), !1;
		}
		if (U) return t = $a.current, t === null ? (r !== Ni && (t = Error(i(423), { cause: r }), Bi(mi(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = mi(r, n), a = Xs(e.stateNode, r, a), Ha(e, a), Wl !== 4 && (Wl = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Ni && (e = Error(i(422), { cause: r }), Bi(mi(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = mi(o, n), Xl === null ? Xl = [o] : Xl.push(o), Wl !== 4 && (Wl = 2), t === null) return !0;
		r = mi(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = Xs(n.stateNode, r, e), Ha(n, e), !1;
				case 1: if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (ru === null || !ru.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = Zs(a), Qs(a, e, n, r), Ha(n, a), !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var ec = Error(i(461)), tc = !1;
	function nc(e, t, n, r) {
		t.child = e === null ? Fa(t, null, n, r) : Pa(t, e.child, n, r);
	}
	function rc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return Xi(t), r = bo(e, t, n, o, a, i), s = wo(), e !== null && !tc ? (To(e, t, i), Dc(e, t, i)) : (U && s && Ei(t), t.flags |= 1, nc(e, t, r, i), t.child);
	}
	function ic(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !ai(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, ac(e, t, a, r, i)) : (e = ci(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !Oc(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? yr : n, n(o, r) && e.ref === t.ref) return Dc(e, t, i);
		}
		return t.flags |= 1, e = oi(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function ac(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (yr(a, r) && e.ref === t.ref) {
				if (tc = !1, t.pendingProps = r = a, Oc(e, i)) e.flags & 131072 && (tc = !0);
				else return t.lanes = e.lanes, Dc(e, t, i);
			}
		}
		return pc(e, t, n, r, i);
	}
	function oc(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return cc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && ga(t, a === null ? null : a.cachePool), a === null ? Za() : Xa(t, a), ro(t);
			else return r = t.lanes = 536870912, cc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && ga(t, null), Za(), io(t)) : (ga(t, a.cachePool), Xa(t, a), io(t), t.memoizedState = null);
		return nc(e, t, i, n), t.child;
	}
	function sc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function cc(e, t, n, r, i) {
		var a = ha();
		return a = a === null ? null : {
			parent: ra._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && ga(t, null), Za(), ro(t), e !== null && Ji(e, t, r, !0), t.childLanes = i, null;
	}
	function lc(e, t) {
		return t = Sc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function uc(e, t, n) {
		return Pa(t, e.child, null, n), e = lc(t, t.pendingProps), e.flags |= 2, ao(t), t.memoizedState = null, e;
	}
	function dc(e, t, n) {
		var r = t.pendingProps, a = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (U) {
				if (r.mode === "hidden") return e = lc(t, r), t.lanes = 536870912, sc(null, e);
				if (no(t), (e = Ai) ? (e = rf(e, Mi), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: xi === null ? null : {
						id: Si,
						overflow: Ci
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = di(e), n.return = t, t.child = n, ki = t, Ai = null)) : e = null, e === null) throw Pi(t);
				return t.lanes = 536870912, null;
			}
			return lc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (no(t), a) {
				if (t.flags & 256) t.flags &= -257, t = uc(e, t, n);
				else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
				else throw Error(i(558));
			} else if (tc || Ji(e, t, n, !1), a = (n & e.childLanes) !== 0, tc || a) {
				if (r = Rl, r !== null && (s = tt(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, $r(e, s), hu(r, e, s), ec;
				Eu(), t = uc(e, t, n);
			} else e = o.treeContext, Ai = cf(s.nextSibling), ki = t, U = !0, ji = null, Mi = !1, e !== null && Oi(t, e), t = lc(t, r), t.flags |= 4096;
			return t;
		}
		return e = oi(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function fc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function pc(e, t, n, r, i) {
		return Xi(t), n = bo(e, t, n, r, void 0, i), r = wo(), e !== null && !tc ? (To(e, t, i), Dc(e, t, i)) : (U && r && Ei(t), t.flags |= 1, nc(e, t, n, i), t.child);
	}
	function mc(e, t, n, r, i, a) {
		return Xi(t), t.updateQueue = null, n = So(t, r, n, i), xo(e), r = wo(), e !== null && !tc ? (To(e, t, a), Dc(e, t, a)) : (U && r && Ei(t), t.flags |= 1, nc(e, t, n, a), t.child);
	}
	function hc(e, t, n, r, i) {
		if (Xi(t), t.stateNode === null) {
			var a = ni, o = n.contextType;
			typeof o == "object" && o && (a = Zi(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Vs, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, La(t), o = n.contextType, a.context = typeof o == "object" && o ? Zi(o) : ni, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Bs(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && Vs.enqueueReplaceState(a, a.state, null), Ga(t, r, a, i), Wa(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Ws(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = ni, typeof u == "object" && u && (o = Zi(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Us(t, a, r, o), Ia = !1;
			var f = t.memoizedState;
			a.state = f, Ga(t, r, a, i), Wa(), l = t.memoizedState, s || f !== l || Ia ? (typeof d == "function" && (Bs(t, n, d, r), l = t.memoizedState), (c = Ia || Hs(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, Ra(e, t), o = t.memoizedProps, u = Ws(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = ni, typeof l == "object" && l && (c = Zi(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Us(t, a, r, c), Ia = !1, f = t.memoizedState, a.state = f, Ga(t, r, a, i), Wa();
			var p = t.memoizedState;
			o !== d || f !== p || Ia || e !== null && e.dependencies !== null && Yi(e.dependencies) ? (typeof s == "function" && (Bs(t, n, s, r), p = t.memoizedState), (u = Ia || Hs(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && Yi(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, fc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = Pa(t, e.child, null, i), t.child = Pa(t, null, n, i)) : nc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = Dc(e, t, i), e;
	}
	function gc(e, t, n, r) {
		return Ri(), t.flags |= 256, nc(e, t, n, r), t.child;
	}
	var _c = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function vc(e) {
		return {
			baseLanes: e,
			cachePool: _a()
		};
	}
	function yc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= Jl), e;
	}
	function bc(e, t, n) {
		var r = t.pendingProps, a = !1, o = !!(t.flags & 128), s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : !!(oo.current & 2)), s && (a = !0, t.flags &= -129), s = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (U) {
				if (a ? to(t) : io(t), (e = Ai) ? (e = rf(e, Mi), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: xi === null ? null : {
						id: Si,
						overflow: Ci
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = di(e), n.return = t, t.child = n, ki = t, Ai = null)) : e = null, e === null) throw Pi(t);
				return of(e) ? t.lanes = 32 : t.lanes = 536870912, null;
			}
			var c = r.children;
			return r = r.fallback, a ? (io(t), a = t.mode, c = Sc({
				mode: "hidden",
				children: c
			}, a), r = li(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, r = t.child, r.memoizedState = vc(n), r.childLanes = yc(e, s, n), t.memoizedState = _c, sc(null, r)) : (to(t), xc(t, c));
		}
		var l = e.memoizedState;
		if (l !== null && (c = l.dehydrated, c !== null)) {
			if (o) t.flags & 256 ? (to(t), t.flags &= -257, t = Cc(e, t, n)) : t.memoizedState === null ? (io(t), c = r.fallback, a = t.mode, r = Sc({
				mode: "visible",
				children: r.children
			}, a), c = li(c, a, n, null), c.flags |= 2, r.return = t, c.return = t, r.sibling = c, t.child = r, Pa(t, e.child, null, n), r = t.child, r.memoizedState = vc(n), r.childLanes = yc(e, s, n), t.memoizedState = _c, t = sc(null, r)) : (io(t), t.child = e.child, t.flags |= 128, t = null);
			else if (to(t), of(c)) {
				if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
				s = u, r = Error(i(419)), r.stack = "", r.digest = s, Bi({
					value: r,
					source: null,
					stack: null
				}), t = Cc(e, t, n);
			} else if (tc || Ji(e, t, n, !1), s = (n & e.childLanes) !== 0, tc || s) {
				if (s = Rl, s !== null && (r = tt(s, n), r !== 0 && r !== l.retryLane)) throw l.retryLane = r, $r(e, r), hu(s, e, r), ec;
				af(c) || Eu(), t = Cc(e, t, n);
			} else af(c) ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, Ai = cf(c.nextSibling), ki = t, U = !0, ji = null, Mi = !1, e !== null && Oi(t, e), t = xc(t, r.children), t.flags |= 4096);
			return t;
		}
		return a ? (io(t), c = r.fallback, a = t.mode, l = e.child, u = l.sibling, r = oi(l, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (c = li(c, a, n, null), c.flags |= 2) : c = oi(u, c), c.return = t, r.return = t, r.sibling = c, t.child = r, sc(null, r), r = t.child, c = e.child.memoizedState, c === null ? c = vc(n) : (a = c.cachePool, a === null ? a = _a() : (l = ra._currentValue, a = a.parent === l ? a : {
			parent: l,
			pool: l
		}), c = {
			baseLanes: c.baseLanes | n,
			cachePool: a
		}), r.memoizedState = c, r.childLanes = yc(e, s, n), t.memoizedState = _c, sc(e.child, r)) : (to(t), n = e.child, e = n.sibling, n = oi(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (s = t.deletions, s === null ? (t.deletions = [e], t.flags |= 16) : s.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function xc(e, t) {
		return t = Sc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function Sc(e, t) {
		return e = ii(22, e, null, t), e.lanes = 0, e;
	}
	function Cc(e, t, n) {
		return Pa(t, e.child, null, n), e = xc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function wc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Ki(e.return, t, n);
	}
	function Tc(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function Ec(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = oo.current, s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, N(oo, o), nc(e, t, r, n), r = U ? vi : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && wc(e, n, t);
			else if (e.tag === 19) wc(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && so(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), Tc(t, !1, i, n, a, r);
				break;
			case "backwards":
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && so(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				Tc(t, !0, n, null, a, r);
				break;
			case "together":
				Tc(t, !1, null, null, void 0, r);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function Dc(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), Gl |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (Ji(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = oi(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = oi(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function Oc(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && Yi(e)));
	}
	function kc(e, t, n) {
		switch (t.tag) {
			case 3:
				pe(t, t.stateNode.containerInfo), Wi(t, ra, e.memoizedState.cache), Ri();
				break;
			case 27:
			case 5:
				F(t);
				break;
			case 4:
				pe(t, t.stateNode.containerInfo);
				break;
			case 10:
				Wi(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, no(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (to(t), e = Dc(e, t, n), e === null ? null : e.sibling) : bc(e, t, n) : (to(t), t.flags |= 128, null);
				to(t);
				break;
			case 19:
				var i = !!(e.flags & 128);
				if (r = (n & t.childLanes) !== 0, r ||= (Ji(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return Ec(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), N(oo, oo.current), r) break;
				return null;
			case 22: return t.lanes = 0, oc(e, t, n, t.pendingProps);
			case 24: Wi(t, ra, e.memoizedState.cache);
		}
		return Dc(e, t, n);
	}
	function Ac(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) tc = !0;
			else {
				if (!Oc(e, n) && !(t.flags & 128)) return tc = !1, kc(e, t, n);
				tc = !!(e.flags & 131072);
			}
		} else tc = !1, U && t.flags & 1048576 && Ti(t, vi, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = wa(t.elementType), t.type = e, typeof e == "function") ai(e) ? (r = Ws(e, r), t.tag = 1, t = hc(null, t, e, r, n)) : (t.tag = 0, t = pc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === w) {
								t.tag = 11, t = rc(null, t, e, r, n);
								break a;
							}
							if (a === E) {
								t.tag = 14, t = ic(null, t, e, r, n);
								break a;
							}
						}
						throw t = ie(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return pc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Ws(r, t.pendingProps), hc(e, t, r, a, n);
			case 3:
				a: {
					if (pe(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, Ra(e, t), Ga(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Wi(t, ra, r), r !== o.cache && qi(t, [ra], n, !0), Wa(), r = s.element, o.isDehydrated) {
						if (o = {
							element: r,
							isDehydrated: !1,
							cache: s.cache
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							t = gc(e, t, r, n);
							break a;
						}
						if (r !== a) {
							a = mi(Error(i(424)), t), Bi(a), t = gc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (Ai = cf(e.firstChild), ki = t, U = !0, ji = null, Mi = !0, n = Fa(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					} else {
						if (Ri(), r === a) {
							t = Dc(e, t, n);
							break a;
						}
						nc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return fc(e, t), e === null ? (n = kf(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : U || (n = t.type, e = t.pendingProps, r = Bd(de.current).createElement(n), r[ot] = t, r[st] = e, Pd(r, n, e), vt(r), t.stateNode = r) : t.memoizedState = kf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return F(t), e === null && U && (r = t.stateNode = ff(t.type, t.pendingProps, de.current), ki = t, Mi = !0, a = Ai, Zd(t.type) ? (lf = a, Ai = cf(r.firstChild)) : Ai = a), nc(e, t, t.pendingProps.children, n), fc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && U && ((a = r = Ai) && (r = tf(r, t.type, t.pendingProps, Mi), r === null ? a = !1 : (t.stateNode = r, ki = t, Ai = cf(r.firstChild), Mi = !1, a = !0)), a || Pi(t)), F(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, Ud(a, o) ? r = null : s !== null && Ud(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = bo(e, t, Co, null, null, n), Qf._currentValue = a), fc(e, t), nc(e, t, r, n), t.child;
			case 6: return e === null && U && ((e = n = Ai) && (n = nf(n, t.pendingProps, Mi), n === null ? e = !1 : (t.stateNode = n, ki = t, Ai = null, e = !0)), e || Pi(t)), null;
			case 13: return bc(e, t, n);
			case 4: return pe(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Pa(t, null, r, n) : nc(e, t, r, n), t.child;
			case 11: return rc(e, t, t.type, t.pendingProps, n);
			case 7: return nc(e, t, t.pendingProps, n), t.child;
			case 8: return nc(e, t, t.pendingProps.children, n), t.child;
			case 12: return nc(e, t, t.pendingProps.children, n), t.child;
			case 10: return r = t.pendingProps, Wi(t, t.type, r.value), nc(e, t, r.children, n), t.child;
			case 9: return a = t.type._context, r = t.pendingProps.children, Xi(t), a = Zi(a), r = r(a), t.flags |= 1, nc(e, t, r, n), t.child;
			case 14: return ic(e, t, t.type, t.pendingProps, n);
			case 15: return ac(e, t, t.type, t.pendingProps, n);
			case 19: return Ec(e, t, n);
			case 31: return dc(e, t, n);
			case 22: return oc(e, t, n, t.pendingProps);
			case 24: return Xi(t), r = Zi(ra), e === null ? (a = ha(), a === null && (a = Rl, o = ia(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, La(t), Wi(t, ra, a)) : ((e.lanes & n) !== 0 && (Ra(e, t), Ga(t, null, null, n), Wa()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Wi(t, ra, r), r !== a.cache && qi(t, [ra], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Wi(t, ra, r))), nc(e, t, t.pendingProps.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function jc(e) {
		e.flags |= 4;
	}
	function Mc(e, t, n, r, i) {
		if ((t = !!(e.mode & 32)) && (t = !1), t) {
			if (e.flags |= 16777216, (i & 335544128) === i) {
				if (e.stateNode.complete) e.flags |= 8192;
				else if (Cu()) e.flags |= 8192;
				else throw Ta = xa, ya;
			}
		} else e.flags &= -16777217;
	}
	function Nc(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Wf(t)) {
			if (Cu()) e.flags |= 8192;
			else throw Ta = xa, ya;
		}
	}
	function Pc(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : Ye(), e.lanes |= t, Yl |= t);
	}
	function Fc(e, t) {
		if (!U) switch (e.tailMode) {
			case "hidden":
				t = e.tail;
				for (var n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
				break;
			case "collapsed":
				n = e.tail;
				for (var r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
		}
	}
	function Ic(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 65011712, r |= i.flags & 65011712, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Lc(e, t, n) {
		var r = t.pendingProps;
		switch (Di(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return Ic(t), null;
			case 1: return Ic(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), Gi(ra), me(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (Li(t) ? jc(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, zi())), Ic(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (jc(t), o === null ? (Ic(t), Mc(t, a, null, r, n)) : (Ic(t), Nc(t, o))) : o ? o === e.memoizedState ? (Ic(t), t.flags &= -16777217) : (jc(t), Ic(t), Nc(t, o)) : (e = e.memoizedProps, e !== r && jc(t), Ic(t), Mc(t, a, e, r, n)), null;
			case 27:
				if (I(t), n = de.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && jc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Ic(t), null;
					}
					e = ue.current, Li(t) ? Fi(t, e) : (e = ff(a, r, n), t.stateNode = e, jc(t));
				}
				return Ic(t), null;
			case 5:
				if (I(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && jc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Ic(t), null;
					}
					if (o = ue.current, Li(t)) Fi(t, o);
					else {
						var s = Bd(de.current);
						switch (o) {
							case 1:
								o = s.createElementNS("http://www.w3.org/2000/svg", a);
								break;
							case 2:
								o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
								break;
							default: switch (a) {
								case "svg":
									o = s.createElementNS("http://www.w3.org/2000/svg", a);
									break;
								case "math":
									o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
									break;
								case "script":
									o = s.createElement("div"), o.innerHTML = "<script><\/script>", o = o.removeChild(o.firstChild);
									break;
								case "select":
									o = typeof r.is == "string" ? s.createElement("select", { is: r.is }) : s.createElement("select"), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
									break;
								default: o = typeof r.is == "string" ? s.createElement(a, { is: r.is }) : s.createElement(a);
							}
						}
						o[ot] = t, o[st] = r;
						a: for (s = t.child; s !== null;) {
							if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
							else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
								s.child.return = s, s = s.child;
								continue;
							}
							if (s === t) break a;
							for (; s.sibling === null;) {
								if (s.return === null || s.return === t) break a;
								s = s.return;
							}
							s.sibling.return = s.return, s = s.sibling;
						}
						t.stateNode = o;
						a: switch (Pd(o, a, r), a) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && jc(t);
					}
				}
				return Ic(t), Mc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && jc(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = de.current, Li(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = ki, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[ot] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || jd(e.nodeValue, n)), e || Pi(t, !0);
					} else e = Bd(e).createTextNode(r), e[ot] = t, t.stateNode = e;
				}
				return Ic(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = Li(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[ot] = t;
						} else Ri(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Ic(t), e = !1;
					} else n = zi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (ao(t), t) : (ao(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return Ic(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = Li(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[ot] = t;
						} else Ri(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Ic(t), a = !1;
					} else a = zi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (ao(t), t) : (ao(t), null);
				}
				return ao(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), Pc(t, t.updateQueue), Ic(t), null);
			case 4: return me(), e === null && xd(t.stateNode.containerInfo), Ic(t), null;
			case 10: return Gi(t.type), Ic(t), null;
			case 19:
				if (M(oo), r = t.memoizedState, r === null) return Ic(t), null;
				if (a = !!(t.flags & 128), o = r.rendering, o === null) {
					if (a) Fc(r, !1);
					else {
						if (Wl !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = so(e), o !== null) {
								for (t.flags |= 128, Fc(r, !1), e = o.updateQueue, t.updateQueue = e, Pc(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) si(n, e), n = n.sibling;
								return N(oo, oo.current & 1 | 2), U && wi(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && Ee() > tu && (t.flags |= 128, a = !0, Fc(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!a) {
						if (e = so(o), e !== null) {
							if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, Pc(t, e), Fc(r, !0), r.tail === null && r.tailMode === "hidden" && !o.alternate && !U) return Ic(t), null;
						} else 2 * Ee() - r.renderingStartTime > tu && n !== 536870912 && (t.flags |= 128, a = !0, Fc(r, !1), t.lanes = 4194304);
					}
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				return r.tail === null ? (Ic(t), null) : (e = r.tail, r.rendering = e, r.tail = e.sibling, r.renderingStartTime = Ee(), e.sibling = null, n = oo.current, N(oo, a ? n & 1 | 2 : n & 1), U && wi(t, r.treeForkCount), e);
			case 22:
			case 23: return ao(t), Qa(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (Ic(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Ic(t), n = t.updateQueue, n !== null && Pc(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && M(ma), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), Gi(ra), Ic(t), null;
			case 25: return null;
			case 30: return null;
		}
		throw Error(i(156, t.tag));
	}
	function Rc(e, t) {
		switch (Di(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return Gi(ra), me(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return I(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (ao(t), t.alternate === null) throw Error(i(340));
					Ri();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (ao(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					Ri();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return M(oo), null;
			case 4: return me(), null;
			case 10: return Gi(t.type), null;
			case 22:
			case 23: return ao(t), Qa(), e !== null && M(ma), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return Gi(ra), null;
			case 25: return null;
			default: return null;
		}
	}
	function zc(e, t) {
		switch (Di(t), t.tag) {
			case 3:
				Gi(ra), me();
				break;
			case 26:
			case 27:
			case 5:
				I(t);
				break;
			case 4:
				me();
				break;
			case 31:
				t.memoizedState !== null && ao(t);
				break;
			case 13:
				ao(t);
				break;
			case 19:
				M(oo);
				break;
			case 10:
				Gi(t.type);
				break;
			case 22:
			case 23:
				ao(t), Qa(), e !== null && M(ma);
				break;
			case 24: Gi(ra);
		}
	}
	function Bc(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			Q(t, t.return, e);
		}
	}
	function Vc(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								Q(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			Q(t, t.return, e);
		}
	}
	function Hc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				qa(t, n);
			} catch (t) {
				Q(e, e.return, t);
			}
		}
	}
	function Uc(e, t, n) {
		n.props = Ws(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			Q(e, t, n);
		}
	}
	function Wc(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			Q(e, t, n);
		}
	}
	function Gc(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) {
			if (typeof r == "function") try {
				r();
			} catch (n) {
				Q(e, t, n);
			} finally {
				e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
			}
			else if (typeof n == "function") try {
				n(null);
			} catch (n) {
				Q(e, t, n);
			}
			else n.current = null;
		}
	}
	function Kc(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			Q(e, e.return, t);
		}
	}
	function qc(e, t, n) {
		try {
			var r = e.stateNode;
			Fd(r, e.type, n, t), r[st] = t;
		} catch (t) {
			Q(e, e.return, t);
		}
	}
	function Jc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Zd(e.type) || e.tag === 4;
	}
	function Yc(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Jc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Zd(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Xc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(e), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = Yt));
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode, t = null), e = e.child, e !== null)) for (Xc(e, t, n), e = e.sibling; e !== null;) Xc(e, t, n), e = e.sibling;
	}
	function Zc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode), e = e.child, e !== null)) for (Zc(e, t, n), e = e.sibling; e !== null;) Zc(e, t, n), e = e.sibling;
	}
	function Qc(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			Pd(t, r, n), t[ot] = e, t[st] = n;
		} catch (t) {
			Q(e, e.return, t);
		}
	}
	var $c = !1, el = !1, tl = !1, nl = typeof WeakSet == "function" ? WeakSet : Set, rl = null;
	function il(e, t) {
		if (e = e.containerInfo, Rd = sp, e = Cr(e), wr(e)) {
			if ("selectionStart" in e) var n = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				n = (n = e.ownerDocument) && n.defaultView || window;
				var r = n.getSelection && n.getSelection();
				if (r && r.rangeCount !== 0) {
					n = r.anchorNode;
					var a = r.anchorOffset, o = r.focusNode;
					r = r.focusOffset;
					try {
						n.nodeType, o.nodeType;
					} catch {
						n = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== n || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || r !== 0 && f.nodeType !== 3 || (l = s + r), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === n && ++u === a && (c = s), p === o && ++d === r && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					n = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else n = null;
			}
			n ||= {
				start: 0,
				end: 0
			};
		} else n = null;
		for (zd = {
			focusedElem: e,
			selectionRange: n
		}, sp = !1, rl = t; rl !== null;) if (t = rl, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, rl = e;
		else for (; rl !== null;) {
			switch (t = rl, o = t.alternate, e = t.flags, t.tag) {
				case 0:
					if (e & 4 && (e = t.updateQueue, e = e === null ? null : e.events, e !== null)) for (n = 0; n < e.length; n++) a = e[n], a.ref.impl = a.nextImpl;
					break;
				case 11:
				case 15: break;
				case 1:
					if (e & 1024 && o !== null) {
						e = void 0, n = t, a = o.memoizedProps, o = o.memoizedState, r = n.stateNode;
						try {
							var h = Ws(n.type, a);
							e = r.getSnapshotBeforeUpdate(h, o), r.__reactInternalSnapshotBeforeUpdate = e;
						} catch (e) {
							Q(n, n.return, e);
						}
					}
					break;
				case 3:
					if (e & 1024) {
						if (e = t.stateNode.containerInfo, n = e.nodeType, n === 9) ef(e);
						else if (n === 1) switch (e.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								ef(e);
								break;
							default: e.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				default: if (e & 1024) throw Error(i(163));
			}
			if (e = t.sibling, e !== null) {
				e.return = t.return, rl = e;
				break;
			}
			rl = t.return;
		}
	}
	function al(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				bl(e, n), r & 4 && Bc(5, n);
				break;
			case 1:
				if (bl(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						Q(n, n.return, e);
					}
					else {
						var i = Ws(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							Q(n, n.return, e);
						}
					}
				}
				r & 64 && Hc(n), r & 512 && Wc(n, n.return);
				break;
			case 3:
				if (bl(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						qa(e, t);
					} catch (e) {
						Q(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && Qc(n);
			case 26:
			case 5:
				bl(e, n), t === null && r & 4 && Kc(n), r & 512 && Wc(n, n.return);
				break;
			case 12:
				bl(e, n);
				break;
			case 31:
				bl(e, n), r & 4 && dl(e, n);
				break;
			case 13:
				bl(e, n), r & 4 && fl(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = qu.bind(null, n), sf(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || $c, !r) {
					t = t !== null && t.memoizedState !== null || el, i = $c;
					var a = el;
					$c = r, (el = t) && !a ? K(e, n, !!(n.subtreeFlags & 8772)) : bl(e, n), $c = i, el = a;
				}
				break;
			case 30: break;
			default: bl(e, n);
		}
	}
	function ol(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, ol(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && mt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var sl = null, cl = !1;
	function ll(e, t, n) {
		for (n = n.child; n !== null;) ul(e, t, n), n = n.sibling;
	}
	function ul(e, t, n) {
		if (Ie && typeof Ie.onCommitFiberUnmount == "function") try {
			Ie.onCommitFiberUnmount(Fe, n);
		} catch {}
		switch (n.tag) {
			case 26:
				el || Gc(n, t), ll(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				el || Gc(n, t);
				var r = sl, i = cl;
				Zd(n.type) && (sl = n.stateNode, cl = !1), ll(e, t, n), pf(n.stateNode), sl = r, cl = i;
				break;
			case 5: el || Gc(n, t);
			case 6:
				if (r = sl, i = cl, sl = null, ll(e, t, n), sl = r, cl = i, sl !== null) {
					if (cl) try {
						(sl.nodeType === 9 ? sl.body : sl.nodeName === "HTML" ? sl.ownerDocument.body : sl).removeChild(n.stateNode);
					} catch (e) {
						Q(n, t, e);
					}
					else try {
						sl.removeChild(n.stateNode);
					} catch (e) {
						Q(n, t, e);
					}
				}
				break;
			case 18:
				sl !== null && (cl ? (e = sl, Qd(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Np(e)) : Qd(sl, n.stateNode));
				break;
			case 4:
				r = sl, i = cl, sl = n.stateNode.containerInfo, cl = !0, ll(e, t, n), sl = r, cl = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				Vc(2, n, t), el || Vc(4, n, t), ll(e, t, n);
				break;
			case 1:
				el || (Gc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && Uc(n, t, r)), ll(e, t, n);
				break;
			case 21:
				ll(e, t, n);
				break;
			case 22:
				el = (r = el) || n.memoizedState !== null, ll(e, t, n), el = r;
				break;
			default: ll(e, t, n);
		}
	}
	function dl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Np(e);
			} catch (e) {
				Q(t, t.return, e);
			}
		}
	}
	function fl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Np(e);
		} catch (e) {
			Q(t, t.return, e);
		}
	}
	function pl(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new nl()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new nl()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function ml(e, t) {
		var n = pl(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = Ju.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function hl(e, t) {
		var n = t.deletions;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var a = n[r], o = e, s = t, c = s;
			a: for (; c !== null;) {
				switch (c.tag) {
					case 27:
						if (Zd(c.type)) {
							sl = c.stateNode, cl = !1;
							break a;
						}
						break;
					case 5:
						sl = c.stateNode, cl = !1;
						break a;
					case 3:
					case 4:
						sl = c.stateNode.containerInfo, cl = !0;
						break a;
				}
				c = c.return;
			}
			if (sl === null) throw Error(i(160));
			ul(o, s, a), sl = null, cl = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) _l(t, e), t = t.sibling;
	}
	var gl = null;
	function _l(e, t) {
		var n = e.alternate, r = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				hl(t, e), vl(e), r & 4 && (Vc(3, e, e.return), Bc(3, e), Vc(5, e, e.return));
				break;
			case 1:
				hl(t, e), vl(e), r & 512 && (el || n === null || Gc(n, n.return)), r & 64 && $c && (e = e.updateQueue, e !== null && (r = e.callbacks, r !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? r : n.concat(r))));
				break;
			case 26:
				var a = gl;
				if (hl(t, e), vl(e), r & 512 && (el || n === null || Gc(n, n.return)), r & 4) {
					var o = n === null ? null : n.memoizedState;
					if (r = e.memoizedState, n === null) {
						if (r === null) {
							if (e.stateNode === null) {
								a: {
									r = e.type, n = e.memoizedProps, a = a.ownerDocument || a;
									b: switch (r) {
										case "title":
											o = a.getElementsByTagName("title")[0], (!o || o[pt] || o[ot] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector("head > title"))), Pd(o, r, n), o[ot] = e, vt(o), r = o;
											break a;
										case "link":
											var s = Vf("link", "href", a).get(r + (n.href || ""));
											if (s) {
												for (var c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && o.getAttribute("rel") === (n.rel == null ? null : n.rel) && o.getAttribute("title") === (n.title == null ? null : n.title) && o.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
													s.splice(c, 1);
													break b;
												}
											}
											o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
											break;
										case "meta":
											if (s = Vf("meta", "content", a).get(r + (n.content || ""))) {
												for (c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("content") === (n.content == null ? null : "" + n.content) && o.getAttribute("name") === (n.name == null ? null : n.name) && o.getAttribute("property") === (n.property == null ? null : n.property) && o.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
													s.splice(c, 1);
													break b;
												}
											}
											o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
											break;
										default: throw Error(i(468, r));
									}
									o[ot] = e, vt(o), r = o;
								}
								e.stateNode = r;
							} else Hf(a, e.type, e.stateNode);
						} else e.stateNode = If(a, r, e.memoizedProps);
					} else o === r ? r === null && e.stateNode !== null && qc(e, e.memoizedProps, n.memoizedProps) : (o === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : o.count--, r === null ? Hf(a, e.type, e.stateNode) : If(a, r, e.memoizedProps));
				}
				break;
			case 27:
				hl(t, e), vl(e), r & 512 && (el || n === null || Gc(n, n.return)), n !== null && r & 4 && qc(e, e.memoizedProps, n.memoizedProps);
				break;
			case 5:
				if (hl(t, e), vl(e), r & 512 && (el || n === null || Gc(n, n.return)), e.flags & 32) {
					a = e.stateNode;
					try {
						Ht(a, "");
					} catch (t) {
						Q(e, e.return, t);
					}
				}
				r & 4 && e.stateNode != null && (a = e.memoizedProps, qc(e, a, n === null ? a : n.memoizedProps)), r & 1024 && (tl = !0);
				break;
			case 6:
				if (hl(t, e), vl(e), r & 4) {
					if (e.stateNode === null) throw Error(i(162));
					r = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = r;
					} catch (t) {
						Q(e, e.return, t);
					}
				}
				break;
			case 3:
				if (Bf = null, a = gl, gl = gf(t.containerInfo), hl(t, e), gl = a, vl(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
					Np(t.containerInfo);
				} catch (t) {
					Q(e, e.return, t);
				}
				tl && (tl = !1, yl(e));
				break;
			case 4:
				r = gl, gl = gf(e.stateNode.containerInfo), hl(t, e), vl(e), gl = r;
				break;
			case 12:
				hl(t, e), vl(e);
				break;
			case 31:
				hl(t, e), vl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ml(e, r)));
				break;
			case 13:
				hl(t, e), vl(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && ($l = Ee()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ml(e, r)));
				break;
			case 22:
				a = e.memoizedState !== null;
				var l = n !== null && n.memoizedState !== null, u = $c, d = el;
				if ($c = u || a, el = d || l, hl(t, e), el = d, $c = u, vl(e), r & 8192) a: for (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (n === null || l || $c || el || xl(e)), n = null, t = e;;) {
					if (t.tag === 5 || t.tag === 26) {
						if (n === null) {
							l = n = t;
							try {
								if (o = l.stateNode, a) s = o.style, typeof s.setProperty == "function" ? s.setProperty("display", "none", "important") : s.display = "none";
								else {
									c = l.stateNode;
									var f = l.memoizedProps.style, p = f != null && f.hasOwnProperty("display") ? f.display : null;
									c.style.display = p == null || typeof p == "boolean" ? "" : ("" + p).trim();
								}
							} catch (e) {
								Q(l, l.return, e);
							}
						}
					} else if (t.tag === 6) {
						if (n === null) {
							l = t;
							try {
								l.stateNode.nodeValue = a ? "" : l.memoizedProps;
							} catch (e) {
								Q(l, l.return, e);
							}
						}
					} else if (t.tag === 18) {
						if (n === null) {
							l = t;
							try {
								var m = l.stateNode;
								a ? $d(m, !0) : $d(l.stateNode, !1);
							} catch (e) {
								Q(l, l.return, e);
							}
						}
					} else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
						t.child.return = t, t = t.child;
						continue;
					}
					if (t === e) break a;
					for (; t.sibling === null;) {
						if (t.return === null || t.return === e) break a;
						n === t && (n = null), t = t.return;
					}
					n === t && (n = null), t.sibling.return = t.return, t = t.sibling;
				}
				r & 4 && (r = e.updateQueue, r !== null && (n = r.retryQueue, n !== null && (r.retryQueue = null, ml(e, n))));
				break;
			case 19:
				hl(t, e), vl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ml(e, r)));
				break;
			case 30: break;
			case 21: break;
			default: hl(t, e), vl(e);
		}
	}
	function vl(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Jc(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var a = n.stateNode;
						Zc(e, Yc(e), a);
						break;
					case 5:
						var o = n.stateNode;
						n.flags & 32 && (Ht(o, ""), n.flags &= -33), Zc(e, Yc(e), o);
						break;
					case 3:
					case 4:
						var s = n.stateNode.containerInfo;
						Xc(e, Yc(e), s);
						break;
					default: throw Error(i(161));
				}
			} catch (t) {
				Q(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function yl(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			yl(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
		}
	}
	function bl(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) al(e, t.alternate, t), t = t.sibling;
	}
	function xl(e) {
		for (e = e.child; e !== null;) {
			var t = e;
			switch (t.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					Vc(4, t, t.return), xl(t);
					break;
				case 1:
					Gc(t, t.return);
					var n = t.stateNode;
					typeof n.componentWillUnmount == "function" && Uc(t, t.return, n), xl(t);
					break;
				case 27: pf(t.stateNode);
				case 26:
				case 5:
					Gc(t, t.return), xl(t);
					break;
				case 22:
					t.memoizedState === null && xl(t);
					break;
				case 30:
					xl(t);
					break;
				default: xl(t);
			}
			e = e.sibling;
		}
	}
	function K(e, t, n) {
		for (n &&= !!(t.subtreeFlags & 8772), t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags;
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					K(i, a, n), Bc(4, a);
					break;
				case 1:
					if (K(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						Q(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var s = r.stateNode;
						try {
							var c = i.shared.hiddenCallbacks;
							if (c !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Ka(c[i], s);
						} catch (e) {
							Q(r, r.return, e);
						}
					}
					n && o & 64 && Hc(a), Wc(a, a.return);
					break;
				case 27: Qc(a);
				case 26:
				case 5:
					K(i, a, n), n && r === null && o & 4 && Kc(a), Wc(a, a.return);
					break;
				case 12:
					K(i, a, n);
					break;
				case 31:
					K(i, a, n), n && o & 4 && dl(i, a);
					break;
				case 13:
					K(i, a, n), n && o & 4 && fl(i, a);
					break;
				case 22:
					a.memoizedState === null && K(i, a, n), Wc(a, a.return);
					break;
				case 30: break;
				default: K(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Sl(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && aa(n));
	}
	function Cl(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && aa(e));
	}
	function wl(e, t, n, r) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) Tl(e, t, n, r), t = t.sibling;
	}
	function Tl(e, t, n, r) {
		var i = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				wl(e, t, n, r), i & 2048 && Bc(9, t);
				break;
			case 1:
				wl(e, t, n, r);
				break;
			case 3:
				wl(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && aa(e)));
				break;
			case 12:
				if (i & 2048) {
					wl(e, t, n, r), e = t.stateNode;
					try {
						var a = t.memoizedProps, o = a.id, s = a.onPostCommit;
						typeof s == "function" && s(o, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
					} catch (e) {
						Q(t, t.return, e);
					}
				} else wl(e, t, n, r);
				break;
			case 31:
				wl(e, t, n, r);
				break;
			case 13:
				wl(e, t, n, r);
				break;
			case 23: break;
			case 22:
				a = t.stateNode, o = t.alternate, t.memoizedState === null ? a._visibility & 2 ? wl(e, t, n, r) : (a._visibility |= 2, El(e, t, n, r, !!(t.subtreeFlags & 10256) || !1)) : a._visibility & 2 ? wl(e, t, n, r) : Dl(e, t), i & 2048 && Sl(o, t);
				break;
			case 24:
				wl(e, t, n, r), i & 2048 && Cl(t.alternate, t);
				break;
			default: wl(e, t, n, r);
		}
	}
	function El(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					El(a, o, s, c, i), Bc(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, El(a, o, s, c, i)) : u._visibility & 2 ? El(a, o, s, c, i) : Dl(a, o), i && l & 2048 && Sl(o.alternate, o);
					break;
				case 24:
					El(a, o, s, c, i), i && l & 2048 && Cl(o.alternate, o);
					break;
				default: El(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function Dl(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					Dl(n, r), i & 2048 && Sl(r.alternate, r);
					break;
				case 24:
					Dl(n, r), i & 2048 && Cl(r.alternate, r);
					break;
				default: Dl(n, r);
			}
			t = t.sibling;
		}
	}
	var Ol = 8192;
	function kl(e, t, n) {
		if (e.subtreeFlags & Ol) for (e = e.child; e !== null;) Al(e, t, n), e = e.sibling;
	}
	function Al(e, t, n) {
		switch (e.tag) {
			case 26:
				kl(e, t, n), e.flags & Ol && e.memoizedState !== null && Gf(n, gl, e.memoizedState, e.memoizedProps);
				break;
			case 5:
				kl(e, t, n);
				break;
			case 3:
			case 4:
				var r = gl;
				gl = gf(e.stateNode.containerInfo), kl(e, t, n), gl = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Ol, Ol = 16777216, kl(e, t, n), Ol = r) : kl(e, t, n));
				break;
			default: kl(e, t, n);
		}
	}
	function jl(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Ml(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				rl = r, Fl(r, e);
			}
			jl(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Nl(e), e = e.sibling;
	}
	function Nl(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Ml(e), e.flags & 2048 && Vc(9, e, e.return);
				break;
			case 3:
				Ml(e);
				break;
			case 12:
				Ml(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Pl(e)) : Ml(e);
				break;
			default: Ml(e);
		}
	}
	function Pl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				rl = r, Fl(r, e);
			}
			jl(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					Vc(8, t, t.return), Pl(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Pl(t));
					break;
				default: Pl(t);
			}
			e = e.sibling;
		}
	}
	function Fl(e, t) {
		for (; rl !== null;) {
			var n = rl;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					Vc(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: aa(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, rl = r;
			else a: for (n = e; rl !== null;) {
				r = rl;
				var i = r.sibling, a = r.return;
				if (ol(r), r === n) {
					rl = null;
					break a;
				}
				if (i !== null) {
					i.return = a, rl = i;
					break a;
				}
				rl = a;
			}
		}
	}
	var Il = {
		getCacheForType: function(e) {
			var t = Zi(ra), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return Zi(ra).controller.signal;
		}
	}, Ll = typeof WeakMap == "function" ? WeakMap : Map, q = 0, Rl = null, J = null, Y = 0, X = 0, zl = null, Bl = !1, Vl = !1, Hl = !1, Ul = 0, Wl = 0, Gl = 0, Kl = 0, ql = 0, Jl = 0, Yl = 0, Xl = null, Zl = null, Ql = !1, $l = 0, eu = 0, tu = Infinity, nu = null, ru = null, iu = 0, au = null, ou = null, su = 0, cu = 0, lu = null, uu = null, du = 0, fu = null;
	function pu() {
		return q & 2 && Y !== 0 ? Y & -Y : A.T === null ? it() : ud();
	}
	function mu() {
		if (Jl === 0) {
			if (!(Y & 536870912) || U) {
				var e = Ue;
				Ue <<= 1, !(Ue & 3932160) && (Ue = 262144), Jl = e;
			} else Jl = 536870912;
		}
		return e = $a.current, e !== null && (e.flags |= 32), Jl;
	}
	function hu(e, t, n) {
		(e === Rl && (X === 2 || X === 9) || e.cancelPendingCommit !== null) && (xu(e, 0), vu(e, Y, Jl, !1)), Ze(e, n), q & 2 && e === Rl || (e === Rl && (!(q & 2) && (Kl |= n), Wl === 4 && vu(e, Y, Jl, !1)), nd(e));
	}
	function gu(e, t, n) {
		if (q & 6) throw Error(i(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || qe(e, t), a = r ? ku(e, t) : Du(e, t, !0), o = r;
		do {
			if (a === 0) {
				Vl && !r && vu(e, t, 0, !1);
				break;
			}
			if (n = e.current.alternate, o && !_u(n)) a = Du(e, t, !1), o = !1;
			else {
				if (a === 2) {
					if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
					else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
					if (s !== 0) {
						t = s;
						a: {
							var c = e;
							a = Xl;
							var l = c.current.memoizedState.isDehydrated;
							if (l && (xu(c, s).flags |= 256), s = Du(c, s, !1), s !== 2) {
								if (Hl && !l) {
									c.errorRecoveryDisabledLanes |= o, Kl |= o, a = 4;
									break a;
								}
								o = Zl, Zl = a, o !== null && (Zl === null ? Zl = o : Zl.push.apply(Zl, o));
							}
							a = s;
						}
						if (o = !1, a !== 2) continue;
					}
				}
				if (a === 1) {
					xu(e, 0), vu(e, t, 0, !0);
					break;
				}
				a: {
					switch (r = e, o = a, o) {
						case 0:
						case 1: throw Error(i(345));
						case 4: if ((t & 4194048) !== t) break;
						case 6:
							vu(r, t, Jl, !Bl);
							break a;
						case 2:
							Zl = null;
							break;
						case 3:
						case 5: break;
						default: throw Error(i(329));
					}
					if ((t & 62914560) === t && (a = $l + 300 - Ee(), 10 < a)) {
						if (vu(r, t, Jl, !Bl), Ke(r, 0, !0) !== 0) break a;
						su = t, r.timeoutHandle = Kd(Z.bind(null, r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Bl, o, "Throttled", -0, 0), a);
						break a;
					}
					Z(r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Bl, o, null, -0, 0);
				}
				break;
			}
		} while (1);
		nd(e);
	}
	function Z(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		if (e.timeoutHandle = -1, d = t.subtreeFlags, d & 8192 || (d & 16785408) == 16785408) {
			d = {
				stylesheets: null,
				count: 0,
				imgCount: 0,
				imgBytes: 0,
				suspenseyImages: [],
				waitingForImages: !0,
				waitingForViewTransition: !1,
				unsuspend: Yt
			}, Al(t, a, d);
			var m = (a & 62914560) === a ? $l - Ee() : (a & 4194048) === a ? eu - Ee() : 0;
			if (m = qf(d, m), m !== null) {
				su = a, e.cancelPendingCommit = m(Iu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p)), vu(e, a, o, !l);
				return;
			}
		}
		Iu(e, t, a, n, r, i, o, s, c);
	}
	function _u(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!vr(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function vu(e, t, n, r) {
		t &= ~ql, t &= ~Kl, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - Re(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && $e(e, n, t);
	}
	function yu() {
		return q & 6 ? !0 : (rd(0, !1), !1);
	}
	function bu() {
		if (J !== null) {
			if (X === 0) var e = J.return;
			else e = J, Ui = Hi = null, Eo(e), Oa = null, ka = 0, e = J;
			for (; e !== null;) zc(e.alternate, e), e = e.return;
			J = null;
		}
	}
	function xu(e, t) {
		var n = e.timeoutHandle;
		n !== -1 && (e.timeoutHandle = -1, qd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), su = 0, bu(), Rl = e, J = n = oi(e.current, null), Y = t, X = 0, zl = null, Bl = !1, Vl = qe(e, t), Hl = !1, Yl = Jl = ql = Kl = Gl = Wl = 0, Zl = Xl = null, Ql = !1, t & 8 && (t |= t & 32);
		var r = e.entangledLanes;
		if (r !== 0) for (e = e.entanglements, r &= t; 0 < r;) {
			var i = 31 - Re(r), a = 1 << i;
			t |= e[i], r &= ~a;
		}
		return Ul = t, Xr(), n;
	}
	function Su(e, t) {
		W = null, A.H = Is, t === va || t === ba ? (t = Ea(), X = 3) : t === ya ? (t = Ea(), X = 4) : X = t === ec ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, zl = t, J === null && (Wl = 1, Js(e, mi(t, e.current)));
	}
	function Cu() {
		var e = $a.current;
		return e === null ? !0 : (Y & 4194048) === Y ? eo === null : (Y & 62914560) === Y || Y & 536870912 ? e === eo : !1;
	}
	function wu() {
		var e = A.H;
		return A.H = Is, e === null ? Is : e;
	}
	function Tu() {
		var e = A.A;
		return A.A = Il, e;
	}
	function Eu() {
		Wl = 4, Bl || (Y & 4194048) !== Y && $a.current !== null || (Vl = !0), !(Gl & 134217727) && !(Kl & 134217727) || Rl === null || vu(Rl, Y, Jl, !1);
	}
	function Du(e, t, n) {
		var r = q;
		q |= 2;
		var i = wu(), a = Tu();
		(Rl !== e || Y !== t) && (nu = null, xu(e, t)), t = !1;
		var o = Wl;
		a: do
			try {
				if (X !== 0 && J !== null) {
					var s = J, c = zl;
					switch (X) {
						case 8:
							bu(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							$a.current === null && (t = !0);
							var l = X;
							if (X = 0, zl = null, Nu(e, s, c, l), n && Vl) {
								o = 0;
								break a;
							}
							break;
						default: l = X, X = 0, zl = null, Nu(e, s, c, l);
					}
				}
				Ou(), o = Wl;
				break;
			} catch (t) {
				Su(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, Ui = Hi = null, q = r, A.H = i, A.A = a, J === null && (Rl = null, Y = 0, Xr()), o;
	}
	function Ou() {
		for (; J !== null;) ju(J);
	}
	function ku(e, t) {
		var n = q;
		q |= 2;
		var r = wu(), a = Tu();
		Rl !== e || Y !== t ? (nu = null, tu = Ee() + 500, xu(e, t)) : Vl = qe(e, t);
		a: do
			try {
				if (X !== 0 && J !== null) {
					t = J;
					var o = zl;
					b: switch (X) {
						case 1:
							X = 0, zl = null, Nu(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (Sa(o)) {
								X = 0, zl = null, Mu(t);
								break;
							}
							t = function() {
								X !== 2 && X !== 9 || Rl !== e || (X = 7), nd(e);
							}, o.then(t, t);
							break a;
						case 3:
							X = 7;
							break a;
						case 4:
							X = 5;
							break a;
						case 7:
							Sa(o) ? (X = 0, zl = null, Mu(t)) : (X = 0, zl = null, Nu(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (J.tag) {
								case 26: s = J.memoizedState;
								case 5:
								case 27:
									var c = J;
									if (s ? Wf(s) : c.stateNode.complete) {
										X = 0, zl = null;
										var l = c.sibling;
										if (l !== null) J = l;
										else {
											var u = c.return;
											u === null ? J = null : (J = u, Pu(u));
										}
										break b;
									}
							}
							X = 0, zl = null, Nu(e, t, o, 5);
							break;
						case 6:
							X = 0, zl = null, Nu(e, t, o, 6);
							break;
						case 8:
							bu(), Wl = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				Au();
				break;
			} catch (t) {
				Su(e, t);
			}
		while (1);
		return Ui = Hi = null, A.H = r, A.A = a, q = n, J === null ? (Rl = null, Y = 0, Xr(), Wl) : 0;
	}
	function Au() {
		for (; J !== null && !we();) ju(J);
	}
	function ju(e) {
		var t = Ac(e.alternate, e, Ul);
		e.memoizedProps = e.pendingProps, t === null ? Pu(e) : J = t;
	}
	function Mu(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = mc(n, t, t.pendingProps, t.type, void 0, Y);
				break;
			case 11:
				t = mc(n, t, t.pendingProps, t.type.render, t.ref, Y);
				break;
			case 5: Eo(t);
			default: zc(n, t), t = J = si(t, Ul), t = Ac(n, t, Ul);
		}
		e.memoizedProps = e.pendingProps, t === null ? Pu(e) : J = t;
	}
	function Nu(e, t, n, r) {
		Ui = Hi = null, Eo(t), Oa = null, ka = 0;
		var i = t.return;
		try {
			if ($s(e, i, t, n, Y)) {
				Wl = 1, Js(e, mi(n, e.current)), J = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw J = i, t;
			Wl = 1, Js(e, mi(n, e.current)), J = null;
			return;
		}
		t.flags & 32768 ? (U || r === 1 ? e = !0 : Vl || Y & 536870912 ? e = !1 : (Bl = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = $a.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Fu(t, e)) : Pu(t);
	}
	function Pu(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				Fu(t, Bl);
				return;
			}
			e = t.return;
			var n = Lc(t.alternate, t, Ul);
			if (n !== null) {
				J = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				J = t;
				return;
			}
			J = t = e;
		} while (t !== null);
		Wl === 0 && (Wl = 5);
	}
	function Fu(e, t) {
		do {
			var n = Rc(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, J = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				J = e;
				return;
			}
			J = e = n;
		} while (e !== null);
		Wl = 6, J = null;
	}
	function Iu(e, t, n, r, a, o, s, c, l) {
		e.cancelPendingCommit = null;
		do
			Vu();
		while (iu !== 0);
		if (q & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			if (o = t.lanes | t.childLanes, o |= Yr, Qe(e, n, o, s, c, l), e === Rl && (J = Rl = null, Y = 0), ou = t, au = e, su = n, cu = o, lu = a, uu = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, Yu(Ae, function() {
				return Hu(), null;
			})) : (e.callbackNode = null, e.callbackPriority = 0), r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
				r = A.T, A.T = null, a = j.p, j.p = 2, s = q, q |= 4;
				try {
					il(e, t, n);
				} finally {
					q = s, j.p = a, A.T = r;
				}
			}
			iu = 1, Lu(), Ru(), zu();
		}
	}
	function Lu() {
		if (iu === 1) {
			iu = 0;
			var e = au, t = ou, n = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || n) {
				n = A.T, A.T = null;
				var r = j.p;
				j.p = 2;
				var i = q;
				q |= 4;
				try {
					_l(t, e);
					var a = zd, o = Cr(e.containerInfo), s = a.focusedElem, c = a.selectionRange;
					if (o !== s && s && s.ownerDocument && Sr(s.ownerDocument.documentElement, s)) {
						if (c !== null && wr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = xr(s, h), v = xr(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					sp = !!Rd, zd = Rd = null;
				} finally {
					q = i, j.p = r, A.T = n;
				}
			}
			e.current = t, iu = 2;
		}
	}
	function Ru() {
		if (iu === 2) {
			iu = 0;
			var e = au, t = ou, n = !!(t.flags & 8772);
			if (t.subtreeFlags & 8772 || n) {
				n = A.T, A.T = null;
				var r = j.p;
				j.p = 2;
				var i = q;
				q |= 4;
				try {
					al(e, t.alternate, t);
				} finally {
					q = i, j.p = r, A.T = n;
				}
			}
			iu = 3;
		}
	}
	function zu() {
		if (iu === 4 || iu === 3) {
			iu = 0, Te();
			var e = au, t = ou, n = su, r = uu;
			t.subtreeFlags & 10256 || t.flags & 10256 ? iu = 5 : (iu = 0, ou = au = null, Bu(e, e.pendingLanes));
			var i = e.pendingLanes;
			if (i === 0 && (ru = null), rt(n), t = t.stateNode, Ie && typeof Ie.onCommitFiberRoot == "function") try {
				Ie.onCommitFiberRoot(Fe, t, void 0, (t.current.flags & 128) == 128);
			} catch {}
			if (r !== null) {
				t = A.T, i = j.p, j.p = 2, A.T = null;
				try {
					for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
						var s = r[o];
						a(s.value, { componentStack: s.stack });
					}
				} finally {
					A.T = t, j.p = i;
				}
			}
			su & 3 && Vu(), nd(e), i = e.pendingLanes, n & 261930 && i & 42 ? e === fu ? du++ : (du = 0, fu = e) : du = 0, rd(0, !1);
		}
	}
	function Bu(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, aa(t)));
	}
	function Vu() {
		return Lu(), Ru(), zu(), Hu();
	}
	function Hu() {
		if (iu !== 5) return !1;
		var e = au, t = cu;
		cu = 0;
		var n = rt(su), r = A.T, a = j.p;
		try {
			j.p = 32 > n ? 32 : n, A.T = null, n = lu, lu = null;
			var o = au, s = su;
			if (iu = 0, ou = au = null, su = 0, q & 6) throw Error(i(331));
			var c = q;
			if (q |= 4, Nl(o.current), Tl(o, o.current, s, n), q = c, rd(0, !1), Ie && typeof Ie.onPostCommitFiberRoot == "function") try {
				Ie.onPostCommitFiberRoot(Fe, o);
			} catch {}
			return !0;
		} finally {
			j.p = a, A.T = r, Bu(e, t);
		}
	}
	function Uu(e, t, n) {
		t = mi(n, t), t = Xs(e.stateNode, t, 2), e = Ba(e, t, 2), e !== null && (Ze(e, 2), nd(e));
	}
	function Q(e, t, n) {
		if (e.tag === 3) Uu(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				Uu(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (ru === null || !ru.has(r))) {
					e = mi(n, e), n = Zs(2), r = Ba(t, n, 2), r !== null && (Qs(n, r, t, e), Ze(r, 2), nd(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function Wu(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Ll();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (Hl = !0, i.add(n), e = Gu.bind(null, e, t, n), t.then(e, e));
	}
	function Gu(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, Rl === e && (Y & n) === n && (Wl === 4 || Wl === 3 && (Y & 62914560) === Y && 300 > Ee() - $l ? !(q & 2) && xu(e, 0) : ql |= n, Yl === Y && (Yl = 0)), nd(e);
	}
	function Ku(e, t) {
		t === 0 && (t = Ye()), e = $r(e, t), e !== null && (Ze(e, t), nd(e));
	}
	function qu(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), Ku(e, n);
	}
	function Ju(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(i(314));
		}
		r !== null && r.delete(t), Ku(e, n);
	}
	function Yu(e, t) {
		return Se(e, t);
	}
	var Xu = null, Zu = null, Qu = !1, $u = !1, ed = !1, td = 0;
	function nd(e) {
		e !== Zu && e.next === null && (Zu === null ? Xu = Zu = e : Zu = Zu.next = e), $u = !0, Qu || (Qu = !0, ld());
	}
	function rd(e, t) {
		if (!ed && $u) {
			ed = !0;
			do
				for (var n = !1, r = Xu; r !== null;) {
					if (!t) {
						if (e !== 0) {
							var i = r.pendingLanes;
							if (i === 0) var a = 0;
							else {
								var o = r.suspendedLanes, s = r.pingedLanes;
								a = (1 << 31 - Re(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, cd(r, a));
						} else a = Y, a = Ke(r, r === Rl ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || qe(r, a) || (n = !0, cd(r, a));
					}
					r = r.next;
				}
			while (n);
			ed = !1;
		}
	}
	function id() {
		ad();
	}
	function ad() {
		$u = Qu = !1;
		var e = 0;
		td !== 0 && Gd() && (e = td);
		for (var t = Ee(), n = null, r = Xu; r !== null;) {
			var i = r.next, a = od(r, t);
			a === 0 ? (r.next = null, n === null ? Xu = i : n.next = i, i === null && (Zu = n)) : (n = r, (e !== 0 || a & 3) && ($u = !0)), r = i;
		}
		iu !== 0 && iu !== 5 || rd(e, !1), td !== 0 && (td = 0);
	}
	function od(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - Re(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Je(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = Rl, n = Y, n = Ke(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (X === 2 || X === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && Ce(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || qe(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && Ce(r), rt(n)) {
				case 2:
				case 8:
					n = ke;
					break;
				case 32:
					n = Ae;
					break;
				case 268435456:
					n = Me;
					break;
				default: n = Ae;
			}
			return r = sd.bind(null, e), n = Se(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && Ce(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function sd(e, t) {
		if (iu !== 0 && iu !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (Vu() && e.callbackNode !== n) return null;
		var r = Y;
		return r = Ke(e, e === Rl ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (gu(e, r, t), od(e, Ee()), e.callbackNode != null && e.callbackNode === n ? sd.bind(null, e) : null);
	}
	function cd(e, t) {
		if (Vu()) return null;
		gu(e, t, !0);
	}
	function ld() {
		Yd(function() {
			q & 6 ? Se(Oe, id) : ad();
		});
	}
	function ud() {
		if (td === 0) {
			var e = ca;
			e === 0 && (e = He, He <<= 1, !(He & 261888) && (He = 256)), td = e;
		}
		return td;
	}
	function dd(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : Jt("" + e);
	}
	function fd(e, t) {
		var n = t.ownerDocument.createElement("input");
		return n.name = t.name, n.value = t.value, e.id && n.setAttribute("form", e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e;
	}
	function pd(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = dd((i[st] || null).action), o = r.submitter;
			o && (t = (t = o[st] || null) ? dd(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new _n("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (td !== 0) {
								var e = o ? fd(i, o) : new FormData(i);
								Ss(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = o ? fd(i, o) : new FormData(i), Ss(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var md = 0; md < Wr.length; md++) {
		var hd = Wr[md];
		Gr(hd.toLowerCase(), "on" + (hd[0].toUpperCase() + hd.slice(1)));
	}
	Gr(Ir, "onAnimationEnd"), Gr(Lr, "onAnimationIteration"), Gr(Rr, "onAnimationStart"), Gr("dblclick", "onDoubleClick"), Gr("focusin", "onFocus"), Gr("focusout", "onBlur"), Gr(zr, "onTransitionRun"), Gr(Br, "onTransitionStart"), Gr(Vr, "onTransitionCancel"), Gr(Hr, "onTransitionEnd"), St("onMouseEnter", ["mouseout", "mouseover"]), St("onMouseLeave", ["mouseout", "mouseover"]), St("onPointerEnter", ["pointerout", "pointerover"]), St("onPointerLeave", ["pointerout", "pointerover"]), xt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), xt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), xt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), xt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), xt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), xt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var gd = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), _d = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(gd));
	function vd(e, t) {
		t = !!(t & 4);
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Kr(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Kr(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function $(e, t) {
		var n = t[lt];
		n === void 0 && (n = t[lt] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Sd(t, e, 2, !1), n.add(r));
	}
	function yd(e, t, n) {
		var r = 0;
		t && (r |= 4), Sd(n, e, r, t);
	}
	var bd = "_reactListening" + Math.random().toString(36).slice(2);
	function xd(e) {
		if (!e[bd]) {
			e[bd] = !0, yt.forEach(function(t) {
				t !== "selectionchange" && (_d.has(t) || yd(t, !1, e), yd(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[bd] || (t[bd] = !0, yd("selectionchange", !1, t));
		}
	}
	function Sd(e, t, n, r) {
		switch (mp(t)) {
			case 2:
				var i = cp;
				break;
			case 8:
				i = lp;
				break;
			default: i = up;
		}
		n = i.bind(null, t, n, e), i = void 0, !on || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function Cd(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var s = r.tag;
			if (s === 3 || s === 4) {
				var c = r.stateNode.containerInfo;
				if (c === i) break;
				if (s === 4) for (s = r.return; s !== null;) {
					var l = s.tag;
					if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
					s = s.return;
				}
				for (; c !== null;) {
					if (s = ht(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		nn(function() {
			var r = a, i = Zt(n), s = [];
			a: {
				var c = Ur.get(e);
				if (c !== void 0) {
					var l = _n, u = e;
					switch (e) {
						case "keypress": if (fn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = Fn;
							break;
						case "focusin":
							u = "focus", l = En;
							break;
						case "focusout":
							u = "blur", l = En;
							break;
						case "beforeblur":
						case "afterblur":
							l = En;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							l = wn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = Tn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = Ln;
							break;
						case Ir:
						case Lr:
						case Rr:
							l = Dn;
							break;
						case Hr:
							l = Rn;
							break;
						case "scroll":
						case "scrollend":
							l = yn;
							break;
						case "wheel":
							l = zn;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = On;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = In;
							break;
						case "toggle":
						case "beforetoggle": l = Bn;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = rn(m, p), g != null && d.push(wd(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (c = new l(c, u, null, n, i), s.push({
						event: c,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (c = e === "mouseover" || e === "pointerover", l = e === "mouseout" || e === "pointerout", c && n !== Xt && (u = n.relatedTarget || n.fromElement) && (ht(u) || u[ct])) break a;
					if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? ht(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
						if (d = wn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = In, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = l == null ? c : z(l), h = u == null ? c : z(u), c = new d(g, m + "leave", l, n, i), c.target = f, c.relatedTarget = h, g = null, ht(i) === r && (d = new d(p, m + "enter", u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
							for (d = Ed, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;
							g = 0;
							for (var _ = m; _; _ = d(_)) g++;
							for (; 0 < h - g;) p = d(p), h--;
							for (; 0 < g - h;) m = d(m), g--;
							for (; h--;) {
								if (p === m || m !== null && p === m.alternate) {
									d = p;
									break b;
								}
								p = d(p), m = d(m);
							}
							d = null;
						}
						else d = null;
						l !== null && Dd(s, c, l, d, !1), u !== null && f !== null && Dd(s, f, u, d, !0);
					}
				}
				a: {
					if (c = r ? z(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var v = or;
					else if (er(c)) {
						if (sr) v = gr;
						else {
							v = mr;
							var y = pr;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && Gt(r.elementType) && (v = or) : v = hr;
					if (v &&= v(e, r)) {
						tr(s, v, n, i);
						break a;
					}
					y && y(e, c, r), e === "focusout" && r && c.type === "number" && r.memoizedProps.value != null && zt(c, "number", c.value);
				}
				switch (y = r ? z(r) : window, e) {
					case "focusin":
						(er(y) || y.contentEditable === "true") && (Er = y, Dr = r, Or = null);
						break;
					case "focusout":
						Or = Dr = Er = null;
						break;
					case "mousedown":
						kr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						kr = !1, Ar(s, n, i);
						break;
					case "selectionchange": if (Tr) break;
					case "keydown":
					case "keyup": Ar(s, n, i);
				}
				var b;
				if (Hn) b: {
					switch (e) {
						case "compositionstart":
							var x = "onCompositionStart";
							break b;
						case "compositionend":
							x = "onCompositionEnd";
							break b;
						case "compositionupdate":
							x = "onCompositionUpdate";
							break b;
					}
					x = void 0;
				}
				else Xn ? Jn(e, n) && (x = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (x = "onCompositionStart");
				x && (Gn && n.locale !== "ko" && (Xn || x !== "onCompositionStart" ? x === "onCompositionEnd" && Xn && (b = dn()) : (cn = i, ln = "value" in cn ? cn.value : cn.textContent, Xn = !0)), y = Td(r, x), 0 < y.length && (x = new kn(x, e, null, n, i), s.push({
					event: x,
					listeners: y
				}), b ? x.data = b : (b = Yn(n), b !== null && (x.data = b)))), (b = Wn ? Zn(e, n) : Qn(e, n)) && (x = Td(r, "onBeforeInput"), 0 < x.length && (y = new kn("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: y,
					listeners: x
				}), y.data = b)), pd(s, e, r, n, i);
			}
			vd(s, t);
		});
	}
	function wd(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function Td(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = rn(e, n), i != null && r.unshift(wd(e, i, a)), i = rn(e, t), i != null && r.push(wd(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Ed(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Dd(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = rn(n, a), l != null && o.unshift(wd(n, l, c))) : i || (l = rn(n, a), l != null && o.push(wd(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var Od = /\r\n?/g, kd = /\u0000|\uFFFD/g;
	function Ad(e) {
		return (typeof e == "string" ? e : "" + e).replace(Od, "\n").replace(kd, "");
	}
	function jd(e, t) {
		return t = Ad(t), Ad(e) === t;
	}
	function Md(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				typeof r == "string" ? t === "body" || t === "textarea" && r === "" || Ht(e, r) : (typeof r == "number" || typeof r == "bigint") && t !== "body" && Ht(e, "" + r);
				break;
			case "className":
				Dt(e, "class", r);
				break;
			case "tabIndex":
				Dt(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Dt(e, n, r);
				break;
			case "style":
				Wt(e, r, o);
				break;
			case "data": if (t !== "object") {
				Dt(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href") || r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Jt("" + r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				}
				if (typeof o == "function" && (n === "formAction" ? (t !== "input" && Md(e, t, "name", a.name, a, null), Md(e, t, "formEncType", a.formEncType, a, null), Md(e, t, "formMethod", a.formMethod, a, null), Md(e, t, "formTarget", a.formTarget, a, null)) : (Md(e, t, "encType", a.encType, a, null), Md(e, t, "method", a.method, a, null), Md(e, t, "target", a.target, a, null))), r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Jt("" + r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = Yt);
				break;
			case "onScroll":
				r != null && $("scroll", e);
				break;
			case "onScrollEnd":
				r != null && $("scrollend", e);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = Jt("" + r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "" + r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				$("beforetoggle", e), $("toggle", e), Et(e, "popover", r);
				break;
			case "xlinkActuate":
				Ot(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				Ot(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				Ot(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				Ot(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				Ot(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				Ot(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				Ot(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				Ot(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				Ot(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Et(e, "is", r);
				break;
			case "innerText":
			case "textContent": break;
			default: (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = Kt.get(n) || n, Et(e, n, r));
		}
	}
	function Nd(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				Wt(e, r, o);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "children":
				typeof r == "string" ? Ht(e, r) : (typeof r == "number" || typeof r == "bigint") && Ht(e, "" + r);
				break;
			case "onScroll":
				r != null && $("scroll", e);
				break;
			case "onScrollEnd":
				r != null && $("scrollend", e);
				break;
			case "onClick":
				r != null && (e.onclick = Yt);
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": break;
			case "innerText":
			case "textContent": break;
			default: if (!bt.hasOwnProperty(n)) a: {
				if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), t = n.slice(2, a ? n.length - 7 : void 0), o = e[st] || null, o = o == null ? null : o[n], typeof o == "function" && e.removeEventListener(t, o, a), typeof r == "function")) {
					typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(t, r, a);
					break a;
				}
				n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Et(e, n, r);
			}
		}
	}
	function Pd(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				$("error", e), $("load", e);
				var r = !1, a = !1, o;
				for (o in n) if (n.hasOwnProperty(o)) {
					var s = n[o];
					if (s != null) switch (o) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							a = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(i(137, t));
						default: Md(e, t, o, s, n, null);
					}
				}
				a && Md(e, t, "srcSet", n.srcSet, n, null), r && Md(e, t, "src", n.src, n, null);
				return;
			case "input":
				$("invalid", e);
				var c = o = s = a = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							a = d;
							break;
						case "type":
							s = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							o = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(i(137, t));
							break;
						default: Md(e, t, r, d, n, null);
					}
				}
				Rt(e, o, c, l, u, s, a, !1);
				return;
			case "select":
				for (a in $("invalid", e), r = s = o = null, n) if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
					case "value":
						o = c;
						break;
					case "defaultValue":
						s = c;
						break;
					case "multiple": r = c;
					default: Md(e, t, a, c, n, null);
				}
				t = o, n = s, e.multiple = !!r, t == null ? n != null && Bt(e, !!r, n, !0) : Bt(e, !!r, t, !1);
				return;
			case "textarea":
				for (s in $("invalid", e), o = a = r = null, n) if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						a = c;
						break;
					case "children":
						o = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(i(91));
						break;
					default: Md(e, t, s, c, n, null);
				}
				V(e, r, a, o);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: Md(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				$("beforetoggle", e), $("toggle", e), $("cancel", e), $("close", e);
				break;
			case "iframe":
			case "object":
				$("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < gd.length; r++) $(gd[r], e);
				break;
			case "image":
				$("error", e), $("load", e);
				break;
			case "details":
				$("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": $("error", e), $("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(i(137, t));
					default: Md(e, t, u, r, n, null);
				}
				return;
			default: if (Gt(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && Nd(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && Md(e, t, c, r, n, null));
	}
	function Fd(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var a = null, o = null, s = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || Md(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							o = m;
							break;
						case "name":
							a = m;
							break;
						case "checked":
							u = m;
							break;
						case "defaultChecked":
							d = m;
							break;
						case "value":
							s = m;
							break;
						case "defaultValue":
							c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && Md(e, t, p, m, r, f);
					}
				}
				Lt(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || Md(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						p = o;
						break;
					case "defaultValue":
						c = o;
						break;
					case "multiple": s = o;
					default: o !== l && Md(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? Bt(e, !!n, n ? [] : "", !1) : Bt(e, !!n, t, !0)) : Bt(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: Md(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						p = a;
						break;
					case "defaultValue":
						m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && Md(e, t, s, a, r, o);
				}
				Vt(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: Md(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: Md(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && Md(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(i(137, t));
						break;
					default: Md(e, t, u, p, r, m);
				}
				return;
			default: if (Gt(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && Nd(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || Nd(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && Md(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || Md(e, t, f, p, r, m);
	}
	function Id(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function Ld() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && Id(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && Id(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var Rd = null, zd = null;
	function Bd(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function Vd(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function Hd(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function Ud(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var Wd = null;
	function Gd() {
		var e = window.event;
		return e && e.type === "popstate" ? e !== Wd && (Wd = e, !0) : (Wd = null, !1);
	}
	var Kd = typeof setTimeout == "function" ? setTimeout : void 0, qd = typeof clearTimeout == "function" ? clearTimeout : void 0, Jd = typeof Promise == "function" ? Promise : void 0, Yd = typeof queueMicrotask == "function" ? queueMicrotask : Jd === void 0 ? Kd : function(e) {
		return Jd.resolve(null).then(e).catch(Xd);
	};
	function Xd(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Zd(e) {
		return e === "head";
	}
	function Qd(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) {
				if (n = i.data, n === "/$" || n === "/&") {
					if (r === 0) {
						e.removeChild(i), Np(t);
						return;
					}
					r--;
				} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
				else if (n === "html") pf(e.ownerDocument.documentElement);
				else if (n === "head") {
					n = e.ownerDocument.head, pf(n);
					for (var a = n.firstChild; a;) {
						var o = a.nextSibling, s = a.nodeName;
						a[pt] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
					}
				} else n === "body" && pf(e.ownerDocument.body);
			}
			n = i;
		} while (n);
		Np(t);
	}
	function $d(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) {
				if (n = r.data, n === "/$") {
					if (e === 0) break;
					e--;
				} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			}
			n = r;
		} while (n);
	}
	function ef(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					ef(n), mt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function tf(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) {
				if (t === "input" && e.type === "hidden") {
					var a = i.name == null ? null : "" + i.name;
					if (i.type === "hidden" && e.getAttribute("name") === a) return e;
				} else return e;
			} else if (!e[pt]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = cf(e.nextSibling), e === null) break;
		}
		return null;
	}
	function nf(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function rf(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function af(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function of(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function sf(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function cf(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var lf = null;
	function uf(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return cf(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function df(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function ff(e, t, n) {
		switch (t = Bd(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(i(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(i(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(i(454));
				return e;
			default: throw Error(i(451));
		}
	}
	function pf(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		mt(e);
	}
	var mf = /* @__PURE__ */ new Map(), hf = /* @__PURE__ */ new Set();
	function gf(e) {
		return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
	}
	var _f = j.d;
	j.d = {
		f: vf,
		r: yf,
		D: Sf,
		C: Cf,
		L: wf,
		m: Tf,
		X: Df,
		S: Ef,
		M: Of
	};
	function vf() {
		var e = _f.f(), t = yu();
		return e || t;
	}
	function yf(e) {
		var t = gt(e);
		t !== null && t.tag === 5 && t.type === "form" ? ws(t) : _f.r(e);
	}
	var bf = typeof document > "u" ? null : document;
	function xf(e, t, n) {
		var r = bf;
		if (r && typeof t == "string" && t) {
			var i = It(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), hf.has(i) || (hf.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), Pd(t, "link", e), vt(t), r.head.appendChild(t)));
		}
	}
	function Sf(e) {
		_f.D(e), xf("dns-prefetch", e, null);
	}
	function Cf(e, t) {
		_f.C(e, t), xf("preconnect", e, t);
	}
	function wf(e, t, n) {
		_f.L(e, t, n);
		var r = bf;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + It(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + It(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + It(n.imageSizes) + "\"]")) : i += "[href=\"" + It(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Af(e);
					break;
				case "script": a = Pf(e);
			}
			mf.has(a) || (e = h({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), mf.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(jf(a)) || t === "script" && r.querySelector(Ff(a)) || (t = r.createElement("link"), Pd(t, "link", e), vt(t), r.head.appendChild(t)));
		}
	}
	function Tf(e, t) {
		_f.m(e, t);
		var n = bf;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + It(r) + "\"][href=\"" + It(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Pf(e);
			}
			if (!mf.has(a) && (e = h({
				rel: "modulepreload",
				href: e
			}, t), mf.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(Ff(a))) return;
				}
				r = n.createElement("link"), Pd(r, "link", e), vt(r), n.head.appendChild(r);
			}
		}
	}
	function Ef(e, t, n) {
		_f.S(e, t, n);
		var r = bf;
		if (r && e) {
			var i = _t(r).hoistableStyles, a = Af(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(jf(a))) s.loading = 5;
				else {
					e = h({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = mf.get(a)) && Rf(e, n);
					var c = o = r.createElement("link");
					vt(c), Pd(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Lf(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function Df(e, t) {
		_f.X(e, t);
		var n = bf;
		if (n && e) {
			var r = _t(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = h({
				src: e,
				async: !0
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), vt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Of(e, t) {
		_f.M(e, t);
		var n = bf;
		if (n && e) {
			var r = _t(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = h({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), vt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function kf(e, t, n, r) {
		var a = (a = de.current) ? gf(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Af(n.href), n = _t(a).hoistableStyles, r = n.get(t), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Af(n.href);
					var o = _t(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(jf(e))) && !o._p && (s.instance = o, s.state.loading = 5), mf.has(e) || (n = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, mf.set(e, n), o || Nf(a, e, n, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Pf(n), n = _t(a).hoistableScripts, r = n.get(t), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(i(444, e));
		}
	}
	function Af(e) {
		return "href=\"" + It(e) + "\"";
	}
	function jf(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Mf(e) {
		return h({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Nf(e, t, n, r) {
		e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]") ? r.loading = 1 : (t = e.createElement("link"), r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		}), Pd(t, "link", n), vt(t), e.head.appendChild(t));
	}
	function Pf(e) {
		return "[src=\"" + It(e) + "\"]";
	}
	function Ff(e) {
		return "script[async]" + e;
	}
	function If(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + It(n.href) + "\"]");
				if (r) return t.instance = r, vt(r), r;
				var a = h({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), vt(r), Pd(r, "style", a), Lf(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Af(n.href);
				var o = e.querySelector(jf(a));
				if (o) return t.state.loading |= 4, t.instance = o, vt(o), o;
				r = Mf(n), (a = mf.get(a)) && Rf(r, a), o = (e.ownerDocument || e).createElement("link"), vt(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), Pd(o, "link", r), t.state.loading |= 4, Lf(o, n.precedence, e), t.instance = o;
			case "script": return o = Pf(n.src), (a = e.querySelector(Ff(o))) ? (t.instance = a, vt(a), a) : (r = n, (a = mf.get(o)) && (r = h({}, n), zf(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), vt(a), Pd(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Lf(r, n.precedence, e));
		return t.instance;
	}
	function Lf(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Rf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function zf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Bf = null;
	function Vf(e, t, n) {
		if (Bf === null) {
			var r = /* @__PURE__ */ new Map(), i = Bf = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Bf, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[pt] || a[ot] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Hf(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function Uf(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Wf(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Gf(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Af(r.href), a = t.querySelector(jf(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = Jf.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, vt(a);
					return;
				}
				a = t.ownerDocument || t, r = Mf(r), (i = mf.get(i)) && Rf(r, i), a = a.createElement("link"), vt(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), Pd(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = Jf.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var Kf = 0;
	function qf(e, t) {
		return e.stylesheets && e.count === 0 && Xf(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && Kf === 0 && (Kf = 62500 * Ld());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > Kf ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function Jf() {
		if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
			if (this.stylesheets) Xf(this, this.stylesheets);
			else if (this.unsuspend) {
				var e = this.unsuspend;
				this.unsuspend = null, e();
			}
		}
	}
	var Yf = null;
	function Xf(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, Yf = /* @__PURE__ */ new Map(), t.forEach(Zf, e), Yf = null, Jf.call(e));
	}
	function Zf(e, t) {
		if (!(t.state.loading & 4)) {
			var n = Yf.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), Yf.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = Jf.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var Qf = {
		$$typeof: C,
		Provider: null,
		Consumer: null,
		_currentValue: oe,
		_currentValue2: oe,
		_threadCount: 0
	};
	function $f(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Xe(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Xe(0), this.hiddenUpdates = Xe(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new $f(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = ii(3, null, null, t), e.current = a, a.stateNode = e, t = ia(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, La(a), e;
	}
	function tp(e) {
		return e ? (e = ni, e) : ni;
	}
	function np(e, t, n, r, i, a) {
		i = tp(i), r.context === null ? r.context = i : r.pendingContext = i, r = za(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = Ba(e, r, t), n !== null && (hu(n, e, t), Va(n, e, t));
	}
	function rp(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function ip(e, t) {
		rp(e, t), (e = e.alternate) && rp(e, t);
	}
	function ap(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = $r(e, 67108864);
			t !== null && hu(t, e, 67108864), ip(e, 67108864);
		}
	}
	function op(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = pu();
			t = nt(t);
			var n = $r(e, t);
			n !== null && hu(n, e, t), ip(e, t);
		}
	}
	var sp = !0;
	function cp(e, t, n, r) {
		var i = A.T;
		A.T = null;
		var a = j.p;
		try {
			j.p = 2, up(e, t, n, r);
		} finally {
			j.p = a, A.T = i;
		}
	}
	function lp(e, t, n, r) {
		var i = A.T;
		A.T = null;
		var a = j.p;
		try {
			j.p = 8, up(e, t, n, r);
		} finally {
			j.p = a, A.T = i;
		}
	}
	function up(e, t, n, r) {
		if (sp) {
			var i = dp(r);
			if (i === null) Cd(e, t, r, fp, n), Cp(e, r);
			else if (Tp(i, e, t, n, r)) r.stopPropagation();
			else if (Cp(e, r), t & 4 && -1 < Sp.indexOf(e)) {
				for (; i !== null;) {
					var a = gt(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = Ge(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - Re(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									nd(a), !(q & 6) && (tu = Ee() + 500, rd(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = $r(a, 2), s !== null && hu(s, a, 2), yu(), ip(a, 2);
					}
					if (a = dp(r), a === null && Cd(e, t, r, fp, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else Cd(e, t, r, null, n);
		}
	}
	function dp(e) {
		return e = Zt(e), pp(e);
	}
	var fp = null;
	function pp(e) {
		if (fp = null, e = ht(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = c(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return fp = e, null;
	}
	function mp(e) {
		switch (e) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "resize":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (De()) {
				case Oe: return 2;
				case ke: return 8;
				case Ae:
				case je: return 32;
				case Me: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var hp = !1, gp = null, _p = null, vp = null, yp = /* @__PURE__ */ new Map(), bp = /* @__PURE__ */ new Map(), xp = [], Sp = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Cp(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				gp = null;
				break;
			case "dragenter":
			case "dragleave":
				_p = null;
				break;
			case "mouseover":
			case "mouseout":
				vp = null;
				break;
			case "pointerover":
			case "pointerout":
				yp.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": bp.delete(t.pointerId);
		}
	}
	function wp(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = gt(t), t !== null && ap(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Tp(e, t, n, r, i) {
		switch (t) {
			case "focusin": return gp = wp(gp, e, t, n, r, i), !0;
			case "dragenter": return _p = wp(_p, e, t, n, r, i), !0;
			case "mouseover": return vp = wp(vp, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return yp.set(a, wp(yp.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, bp.set(a, wp(bp.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Ep(e) {
		var t = ht(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, at(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, at(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Dp(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = dp(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				Xt = r, n.target.dispatchEvent(r), Xt = null;
			} else return t = gt(n), t !== null && ap(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Op(e, t, n) {
		Dp(e) && n.delete(t);
	}
	function kp() {
		hp = !1, gp !== null && Dp(gp) && (gp = null), _p !== null && Dp(_p) && (_p = null), vp !== null && Dp(vp) && (vp = null), yp.forEach(Op), bp.forEach(Op);
	}
	function Ap(e, n) {
		e.blockedOn === n && (e.blockedOn = null, hp || (hp = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, kp)));
	}
	var jp = null;
	function Mp(e) {
		jp !== e && (jp = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			jp === e && (jp = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (pp(r || n) === null) continue;
					break;
				}
				var a = gt(n);
				a !== null && (e.splice(t, 3), t -= 3, Ss(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Np(e) {
		function t(t) {
			return Ap(t, e);
		}
		gp !== null && Ap(gp, e), _p !== null && Ap(_p, e), vp !== null && Ap(vp, e), yp.forEach(t), bp.forEach(t);
		for (var n = 0; n < xp.length; n++) {
			var r = xp[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < xp.length && (n = xp[0], n.blockedOn === null);) Ep(n), n.blockedOn === null && xp.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[st] || null;
			if (typeof a == "function") o || Mp(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[st] || null) s = o.formAction;
					else if (pp(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Mp(n);
			}
		}
	}
	function Pp() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Fp(e) {
		this._internalRoot = e;
	}
	Ip.prototype.render = Fp.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		np(n, pu(), e, t, null, null);
	}, Ip.prototype.unmount = Fp.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			np(e.current, 2, null, e, null, null), yu(), t[ct] = null;
		}
	};
	function Ip(e) {
		this._internalRoot = e;
	}
	Ip.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = it();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < xp.length && t !== 0 && t < xp[n].priority; n++);
			xp.splice(n, 0, e), n === 0 && Ep(e);
		}
	};
	var Lp = n.version;
	if (Lp !== "19.2.8") throw Error(i(527, Lp, "19.2.8"));
	j.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var Rp = {
		bundleType: 0,
		version: "19.2.8",
		rendererPackageName: "react-dom",
		currentDispatcherRef: A,
		reconcilerVersion: "19.2.8"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var zp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!zp.isDisabled && zp.supportsFiber) try {
			Fe = zp.inject(Rp), Ie = zp;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = Gs, s = Ks, c = qs;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = ep(e, 1, !1, null, null, n, r, null, o, s, c, Pp), e[ct] = t.current, xd(e), new Fp(t);
	};
})), g = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = h();
})), _ = /* @__PURE__ */ c(u(), 1), v = /* @__PURE__ */ c(f(), 1), y = g(), b = "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */\n@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){:root,:host{--shimmer-angle:20deg}*,:before,:after,::backdrop{--tw-translate-x:0;--tw-translate-y:0;--tw-translate-z:0;--tw-scale-x:1;--tw-scale-y:1;--tw-scale-z:1;--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-pan-x:initial;--tw-pan-y:initial;--tw-pinch-zoom:initial;--tw-space-y-reverse:0;--tw-space-x-reverse:0;--tw-divide-x-reverse:0;--tw-border-style:solid;--tw-divide-y-reverse:0;--tw-leading:initial;--tw-font-weight:initial;--tw-tracking:initial;--tw-ordinal:initial;--tw-slashed-zero:initial;--tw-numeric-figure:initial;--tw-numeric-spacing:initial;--tw-numeric-fraction:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-outline-style:solid;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-backdrop-blur:initial;--tw-backdrop-brightness:initial;--tw-backdrop-contrast:initial;--tw-backdrop-grayscale:initial;--tw-backdrop-hue-rotate:initial;--tw-backdrop-invert:initial;--tw-backdrop-opacity:initial;--tw-backdrop-saturate:initial;--tw-backdrop-sepia:initial;--tw-duration:initial;--tw-ease:initial;--tw-content:\"\";--tw-animation-delay:0s;--tw-animation-direction:normal;--tw-animation-duration:initial;--tw-animation-fill-mode:none;--tw-animation-iteration-count:1;--tw-enter-blur:0;--tw-enter-opacity:1;--tw-enter-rotate:0;--tw-enter-scale:1;--tw-enter-translate-x:0;--tw-enter-translate-y:0;--tw-exit-blur:0;--tw-exit-opacity:1;--tw-exit-rotate:0;--tw-exit-scale:1;--tw-exit-translate-x:0;--tw-exit-translate-y:0;--scroll-fade-t:0px;--scroll-fade-b:0px;--scroll-fade-s:0px;--scroll-fade-e:0px;--scroll-fade-mask:initial;--shimmer-image:initial;--shimmer-text-fill:initial}}}@layer theme{:root,:host{--font-sans:\"Geist Variable\", ui-sans-serif, system-ui, sans-serif;--font-mono:\"Geist Mono Variable\", ui-monospace, SFMono-Regular, Menlo, monospace;--color-black:#000;--spacing:.25rem;--container-xs:20rem;--container-sm:24rem;--container-xl:36rem;--container-5xl:64rem;--text-xs:.75rem;--text-xs--line-height:calc(1 / .75);--text-sm:.875rem;--text-sm--line-height:calc(1.25 / .875);--text-base:1rem;--text-base--line-height:calc(1.5 / 1);--text-2xl:1.5rem;--text-2xl--line-height:calc(2 / 1.5);--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--tracking-tight:-.025em;--tracking-normal:0em;--tracking-widest:.1em;--leading-snug:1.375;--radius-md:calc(var(--radius) - 2px);--ease-out:cubic-bezier(0, 0, .2, 1);--ease-in-out:cubic-bezier(.4, 0, .2, 1);--animate-spin:spin 1s linear infinite;--blur-xs:4px;--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4, 0, .2, 1);--default-font-family:\"Geist Variable\", ui-sans-serif, system-ui, sans-serif;--default-mono-font-family:\"Geist Mono Variable\", ui-monospace, SFMono-Regular, Menlo, monospace}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5;font-family:var(--default-font-family,-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", \"Noto Sans\", Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring:where(:not(iframe)){outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}@supports (color:color-mix(in lab, red, red)){::placeholder{color:color-mix(in oklab, currentcolor 50%, transparent)}}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}::-webkit-calendar-picker-indicator{line-height:1}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){appearance:button}::file-selector-button{appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}*,:before,:after,::backdrop{--tw-translate-x:0;--tw-translate-y:0;--tw-translate-z:0;--tw-scale-x:1;--tw-scale-y:1;--tw-scale-z:1;--tw-space-y-reverse:0;--tw-space-x-reverse:0;--tw-divide-x-reverse:0;--tw-divide-y-reverse:0;--tw-border-style:solid;--tw-outline-style:solid;--tw-shadow:0 0 #0000;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-alpha:100%;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-drop-shadow-alpha:100%;--tw-content:\"\";--tw-animation-delay:0s;--tw-animation-direction:normal;--tw-animation-fill-mode:none;--tw-animation-iteration-count:1;--tw-enter-blur:0;--tw-enter-opacity:1;--tw-enter-rotate:0;--tw-enter-scale:1;--tw-enter-translate-x:0;--tw-enter-translate-y:0;--tw-exit-blur:0;--tw-exit-opacity:1;--tw-exit-rotate:0;--tw-exit-scale:1;--tw-exit-translate-x:0;--tw-exit-translate-y:0}*{border-color:var(--border);outline-color:var(--ring)}@supports (color:color-mix(in lab, red, red)){*{outline-color:color-mix(in oklab, var(--ring) 50%, transparent)}}body{background-color:var(--background);color:var(--foreground)}html{font-family:Geist Variable,ui-sans-serif,system-ui,sans-serif}}@layer components;@layer utilities{.\\@container\\/card-header{container:card-header/inline-size}.\\@container{container-type:inline-size}.pointer-events-auto{pointer-events:auto}.pointer-events-none{pointer-events:none}.collapse{visibility:collapse}.invisible{visibility:hidden}.visible{visibility:visible}.sr-only{clip-path:inset(50%);white-space:nowrap;border-width:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.not-sr-only{clip-path:none;white-space:normal;width:auto;height:auto;margin:0;padding:0;position:static;overflow:visible}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.sticky{position:sticky}.inset-0{inset:0}.inset-y-0{inset-block:0}.top-0{top:0}.top-1{top:var(--spacing)}.top-1\\/2{top:50%}.top-1\\/3{top:33.3333%}.top-2{top:calc(var(--spacing) * 2)}.right-2{right:calc(var(--spacing) * 2)}.right-4{right:calc(var(--spacing) * 4)}.bottom-4{bottom:calc(var(--spacing) * 4)}.left-0{left:0}.left-1{left:var(--spacing)}.left-1\\/2{left:50%}.isolate{isolation:isolate}.isolation-auto{isolation:auto}.z-10{z-index:10}.z-50{z-index:50}.order-first{order:-9999}.order-last{order:9999}.col-start-2{grid-column-start:2}.row-span-2{grid-row:span 2/span 2}.row-start-1{grid-row-start:1}.container{width:100%}@media (width>=40rem){.container{max-width:40rem}}@media (width>=48rem){.container{max-width:48rem}}@media (width>=64rem){.container{max-width:64rem}}@media (width>=80rem){.container{max-width:80rem}}@media (width>=96rem){.container{max-width:96rem}}.m-0{margin:0}.-mx-1{margin-inline:calc(var(--spacing) * -1)}.-mx-1\\.5{margin-inline:calc(var(--spacing) * -1.5)}.-mx-4{margin-inline:calc(var(--spacing) * -4)}.mx-1{margin-inline:var(--spacing)}.mx-1\\.5{margin-inline:calc(var(--spacing) * 1.5)}.mx-auto{margin-inline:auto}.my-1{margin-block:var(--spacing)}.-mt-1{margin-top:calc(var(--spacing) * -1)}.mt-0{margin-top:0}.mt-0\\.5{margin-top:calc(var(--spacing) * .5)}.mt-1{margin-top:var(--spacing)}.mt-2{margin-top:calc(var(--spacing) * 2)}.mr-1{margin-right:var(--spacing)}.mr-1\\.5{margin-right:calc(var(--spacing) * 1.5)}.mr-auto{margin-right:auto}.-mb-1{margin-bottom:calc(var(--spacing) * -1)}.-mb-4{margin-bottom:calc(var(--spacing) * -4)}.mb-1{margin-bottom:var(--spacing)}.mb-1\\.5{margin-bottom:calc(var(--spacing) * 1.5)}.mb-2{margin-bottom:calc(var(--spacing) * 2)}.mb-6{margin-bottom:calc(var(--spacing) * 6)}.ml-0{margin-left:0}.ml-0\\.5{margin-left:calc(var(--spacing) * .5)}.ml-auto{margin-left:auto}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}.no-scrollbar::-webkit-scrollbar{display:none}.block{display:block}.contents{display:contents}.flex{display:flex}.flow-root{display:flow-root}.grid{display:grid}.hidden{display:none}.inline{display:inline}.inline-block{display:inline-block}.inline-flex{display:inline-flex}.inline-grid{display:inline-grid}.inline-table{display:inline-table}.list-item{display:list-item}.table{display:table}.table-caption{display:table-caption}.table-cell{display:table-cell}.table-column{display:table-column}.table-column-group{display:table-column-group}.table-footer-group{display:table-footer-group}.table-header-group{display:table-header-group}.table-row{display:table-row}.table-row-group{display:table-row-group}.field-sizing-content{field-sizing:content}.size-1{width:var(--spacing);height:var(--spacing)}.size-1\\.5{width:calc(var(--spacing) * 1.5);height:calc(var(--spacing) * 1.5)}.size-2{width:calc(var(--spacing) * 2);height:calc(var(--spacing) * 2)}.size-2\\.5{width:calc(var(--spacing) * 2.5);height:calc(var(--spacing) * 2.5)}.size-3{width:calc(var(--spacing) * 3);height:calc(var(--spacing) * 3)}.size-3\\!{width:calc(var(--spacing) * 3)!important;height:calc(var(--spacing) * 3)!important}.size-3\\.5{width:calc(var(--spacing) * 3.5);height:calc(var(--spacing) * 3.5)}.size-3\\.5\\!{width:calc(var(--spacing) * 3.5)!important;height:calc(var(--spacing) * 3.5)!important}.size-4{width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.size-6{width:calc(var(--spacing) * 6);height:calc(var(--spacing) * 6)}.size-7{width:calc(var(--spacing) * 7);height:calc(var(--spacing) * 7)}.size-8{width:calc(var(--spacing) * 8);height:calc(var(--spacing) * 8)}.size-9{width:calc(var(--spacing) * 9);height:calc(var(--spacing) * 9)}.size-10{width:calc(var(--spacing) * 10);height:calc(var(--spacing) * 10)}.size-full{width:100%;height:100%}.h-0{height:0}.h-0\\.5{height:calc(var(--spacing) * .5)}.h-1{height:var(--spacing)}.h-5{height:calc(var(--spacing) * 5)}.h-6{height:calc(var(--spacing) * 6)}.h-7{height:calc(var(--spacing) * 7)}.h-8{height:calc(var(--spacing) * 8)}.h-8\\!{height:calc(var(--spacing) * 8)!important}.h-9{height:calc(var(--spacing) * 9)}.h-9\\!{height:calc(var(--spacing) * 9)!important}.h-10{height:calc(var(--spacing) * 10)}.h-11{height:calc(var(--spacing) * 11)}.h-12{height:calc(var(--spacing) * 12)}.h-14{height:calc(var(--spacing) * 14)}.h-32{height:calc(var(--spacing) * 32)}.h-\\[1\\.125rem\\]{height:1.125rem}.h-\\[1\\.375rem\\]{height:1.375rem}.h-auto{height:auto}.h-full{height:100%}.h-px{height:1px}.max-h-\\(--radix-select-content-available-height\\){max-height:var(--radix-select-content-available-height)}.max-h-80{max-height:calc(var(--spacing) * 80)}.min-h-0{min-height:0}.min-h-4{min-height:calc(var(--spacing) * 4)}.min-h-8{min-height:calc(var(--spacing) * 8)}.min-h-10{min-height:calc(var(--spacing) * 10)}.min-h-13{min-height:calc(var(--spacing) * 13)}.min-h-16{min-height:calc(var(--spacing) * 16)}.min-h-22{min-height:calc(var(--spacing) * 22)}.min-h-32{min-height:calc(var(--spacing) * 32)}.min-h-svh{min-height:100svh}.w-4{width:calc(var(--spacing) * 4)}.w-9{width:calc(var(--spacing) * 9)}.w-16{width:calc(var(--spacing) * 16)}.w-24{width:calc(var(--spacing) * 24)}.w-52{width:calc(var(--spacing) * 52)}.w-64{width:calc(var(--spacing) * 64)}.w-80{width:calc(var(--spacing) * 80)}.w-\\[20rem\\]{width:20rem}.w-\\[35\\%\\]{width:35%}.w-\\[35rem\\]{width:35rem}.w-auto{width:auto}.w-fit{width:fit-content}.w-full{width:100%}.max-w-5xl{max-width:var(--container-5xl)}.max-w-\\[25rem\\]{max-width:25rem}.max-w-\\[45rem\\]{max-width:45rem}.max-w-\\[calc\\(100\\%-2rem\\)\\]{max-width:calc(100% - 2rem)}.max-w-full{max-width:100%}.max-w-xl{max-width:var(--container-xl)}.min-w-0{min-width:0}.min-w-36{min-width:calc(var(--spacing) * 36)}.min-w-\\[1\\.125rem\\]{min-width:1.125rem}.flex-1{flex:1}.shrink{flex-shrink:1}.shrink-0{flex-shrink:0}.grow{flex-grow:1}.basis-full{flex-basis:100%}.border-collapse{border-collapse:collapse}.origin-\\(--radix-select-content-transform-origin\\){transform-origin:var(--radix-select-content-transform-origin)}.-translate-x-1{--tw-translate-x:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-x-1\\/2{--tw-translate-x:calc(calc(1 / 2 * 100%) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-x-0{--tw-translate-x:0px;translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-y-1{--tw-translate-y:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-y-1\\/2{--tw-translate-y:calc(calc(1 / 2 * 100%) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-y-0{--tw-translate-y:0px;translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-none{translate:none}.scale-3d{scale:var(--tw-scale-x) var(--tw-scale-y) var(--tw-scale-z)}.transform{transform:var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)}.shimmer{--_spread:var(--shimmer-spread,calc(3ch + 40px));--_base:currentColor;--_highlight:var(--shimmer-color,oklch(from currentColor l c h / calc(alpha* .2)));background-image:var(--shimmer-image,linear-gradient(calc(90deg + var(--shimmer-angle)), var(--_base) calc(50% - var(--_spread)), var(--_highlight) calc(50% - var(--_spread) * .5), var(--_highlight) 50%, var(--_highlight) calc(50% + var(--_spread) * .5), var(--_base) calc(50% + var(--_spread))))}@supports (color:color-mix(in lab, red, red)){.shimmer{background-image:var(--shimmer-image,linear-gradient(calc(90deg + var(--shimmer-angle)), var(--_base) calc(50% - var(--_spread)), color-mix(in oklch, var(--_highlight), var(--_base) 50%) calc(50% - var(--_spread) * .5), var(--_highlight) 50%, color-mix(in oklch, var(--_highlight), var(--_base) 50%) calc(50% + var(--_spread) * .5), var(--_base) calc(50% + var(--_spread))))}}.shimmer{background-repeat:no-repeat;background-size:calc(200% + var(--_spread) * 2) 100%;-webkit-text-fill-color:var(--shimmer-text-fill,transparent);animation:tw-shimmer var(--shimmer-duration,2s) linear infinite;background-position:0 0;-webkit-background-clip:text;background-clip:text}.shimmer:is(.dark *),:host(.dark) .shimmer{--_highlight:var(--shimmer-color,oklch(from currentColor max(.8, calc(l + .4)) c h / calc(alpha + .4)))}.shimmer:where([dir=rtl],[dir=rtl] *){animation-direction:reverse}.scroll-fade{--_scroll-fade-size-t:var(--scroll-fade-t-size,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))));--_scroll-fade-size-b:var(--scroll-fade-b-size,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))));--scroll-fade-block:linear-gradient(to bottom, transparent 0, #000 var(--scroll-fade-t,0px), #000 calc(100% - var(--scroll-fade-b,0px)), transparent 100%);-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));mask-image:var(--scroll-fade-mask,var(--scroll-fade-block));-webkit-mask-composite:source-in;-webkit-mask-composite:source-in;-webkit-mask-composite:source-in;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-composite:source-in;mask-composite:intersect}@supports (animation-timeline:scroll()){.scroll-fade{animation:1ms ease-in-out scroll-fade-reveal-t,1ms ease-in-out scroll-fade-reveal-b;animation-timeline:scroll(self y),scroll(self y);animation-range:0 var(--scroll-fade-reveal,calc(var(--spacing) * 24)), calc(100% - var(--scroll-fade-reveal,calc(var(--spacing) * 24))) 100%;animation-fill-mode:both}}@supports not (animation-timeline:scroll()){.scroll-fade{--scroll-fade-t:var(--_scroll-fade-size-t);--scroll-fade-b:var(--_scroll-fade-size-b)}}.animate-check-in{animation:.22s cubic-bezier(.16,1,.3,1) both s4e-check-in}.animate-download-in{animation:.24s cubic-bezier(.16,1,.3,1) both s4e-surface-in}.animate-in{animation:enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none)}.animate-spin{animation:var(--animate-spin)}.animate-surface-in{animation:.16s cubic-bezier(.16,1,.3,1) s4e-screen-in}.cursor-default{cursor:default}.cursor-pointer{cursor:pointer}.cursor-text{cursor:text}.touch-pinch-zoom{--tw-pinch-zoom:pinch-zoom;touch-action:var(--tw-pan-x,) var(--tw-pan-y,) var(--tw-pinch-zoom,)}.resize{resize:both}.resize-none{resize:none}.scroll-my-1{scroll-margin-block:var(--spacing)}.scroll-py-1{scroll-padding-block:var(--spacing)}.list-none{list-style-type:none}.auto-rows-min{grid-auto-rows:min-content}.grid-rows-\\[auto_1fr\\]{grid-template-rows:auto 1fr}.flex-col{flex-direction:column}.flex-col-reverse{flex-direction:column-reverse}.flex-wrap{flex-wrap:wrap}.place-items-center{place-items:center}.items-center{align-items:center}.items-start{align-items:flex-start}.items-stretch{align-items:stretch}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-end{justify-content:flex-end}.justify-start{justify-content:flex-start}.gap-\\(--card-spacing\\){gap:var(--card-spacing)}.gap-0{gap:0}.gap-0\\.5{gap:calc(var(--spacing) * .5)}.gap-1{gap:var(--spacing)}.gap-1\\.5{gap:calc(var(--spacing) * 1.5)}.gap-2{gap:calc(var(--spacing) * 2)}.gap-2\\.5{gap:calc(var(--spacing) * 2.5)}.gap-3{gap:calc(var(--spacing) * 3)}.gap-4{gap:calc(var(--spacing) * 4)}.gap-6{gap:calc(var(--spacing) * 6)}:where(.space-y-reverse>:not(:last-child)){--tw-space-y-reverse:1}.gap-x-2{column-gap:calc(var(--spacing) * 2)}:where(.space-x-reverse>:not(:last-child)){--tw-space-x-reverse:1}.gap-y-1{row-gap:var(--spacing)}.gap-y-1\\.5{row-gap:calc(var(--spacing) * 1.5)}.gap-y-2{row-gap:calc(var(--spacing) * 2)}:where(.divide-x>:not(:last-child)){--tw-divide-x-reverse:0;border-inline-style:var(--tw-border-style);border-inline-start-width:calc(1px * var(--tw-divide-x-reverse));border-inline-end-width:calc(1px * calc(1 - var(--tw-divide-x-reverse)))}:where(.divide-y>:not(:last-child)){--tw-divide-y-reverse:0;border-bottom-style:var(--tw-border-style);border-top-style:var(--tw-border-style);border-top-width:calc(1px * var(--tw-divide-y-reverse));border-bottom-width:calc(1px * calc(1 - var(--tw-divide-y-reverse)))}:where(.divide-y-reverse>:not(:last-child)){--tw-divide-y-reverse:1}.self-start{align-self:flex-start}.justify-self-end{justify-self:flex-end}.truncate{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.overflow-hidden{overflow:hidden}.overflow-x-clip{overflow-x:clip}.overflow-x-hidden{overflow-x:hidden}.overflow-y-auto{overflow-y:auto}.rounded{border-radius:.25rem}.rounded-\\[0\\.5rem\\]{border-radius:.5rem}.rounded-\\[0\\.25rem\\]{border-radius:.25rem}.rounded-\\[0\\.375rem\\]{border-radius:.375rem}.rounded-\\[0\\.625rem\\]{border-radius:.625rem}.rounded-\\[calc\\(var\\(--radius\\)-3px\\)\\]{border-radius:calc(var(--radius) - 3px)}.rounded-\\[min\\(var\\(--radius-md\\)\\,10px\\)\\]{border-radius:min(var(--radius-md), 10px)}.rounded-\\[min\\(var\\(--radius-md\\)\\,12px\\)\\]{border-radius:min(var(--radius-md), 12px)}.rounded-full{border-radius:2147483647px}.rounded-lg{border-radius:var(--radius)}.rounded-md{border-radius:calc(var(--radius) - 2px)}.rounded-none{border-radius:0}.rounded-sm{border-radius:calc(var(--radius) - 4px)}.rounded-xl{border-radius:calc(var(--radius) + 4px)}.rounded-xl\\!{border-radius:calc(var(--radius) + 4px)!important}.rounded-s{border-start-start-radius:.25rem;border-end-start-radius:.25rem}.rounded-ss{border-start-start-radius:.25rem}.rounded-e{border-start-end-radius:.25rem;border-end-end-radius:.25rem}.rounded-se{border-start-end-radius:.25rem}.rounded-ee{border-end-end-radius:.25rem}.rounded-es{border-end-start-radius:.25rem}.rounded-t{border-top-left-radius:.25rem;border-top-right-radius:.25rem}.rounded-t-xl{border-top-left-radius:calc(var(--radius) + 4px);border-top-right-radius:calc(var(--radius) + 4px)}.rounded-l{border-top-left-radius:.25rem;border-bottom-left-radius:.25rem}.rounded-tl{border-top-left-radius:.25rem}.rounded-r{border-top-right-radius:.25rem;border-bottom-right-radius:.25rem}.rounded-tr{border-top-right-radius:.25rem}.rounded-b{border-bottom-right-radius:.25rem;border-bottom-left-radius:.25rem}.rounded-b-xl{border-bottom-right-radius:calc(var(--radius) + 4px);border-bottom-left-radius:calc(var(--radius) + 4px)}.rounded-br{border-bottom-right-radius:.25rem}.rounded-bl{border-bottom-left-radius:.25rem}.border{border-style:var(--tw-border-style);border-width:1px}.border-0{border-style:var(--tw-border-style);border-width:0}.border-\\[0\\.0938rem\\]{border-style:var(--tw-border-style);border-width:.0938rem}.border-x{border-inline-style:var(--tw-border-style);border-inline-width:1px}.border-y{border-block-style:var(--tw-border-style);border-block-width:1px}.border-s{border-inline-start-style:var(--tw-border-style);border-inline-start-width:1px}.border-e{border-inline-end-style:var(--tw-border-style);border-inline-end-width:1px}.border-bs{border-block-start-style:var(--tw-border-style);border-block-start-width:1px}.border-be{border-block-end-style:var(--tw-border-style);border-block-end-width:1px}.border-t{border-top-style:var(--tw-border-style);border-top-width:1px}.border-r{border-right-style:var(--tw-border-style);border-right-width:1px}.border-b{border-bottom-style:var(--tw-border-style);border-bottom-width:1px}.border-l{border-left-style:var(--tw-border-style);border-left-width:1px}.border-dashed{--tw-border-style:dashed;border-style:dashed}.border-border,.border-border\\/60{border-color:var(--border)}@supports (color:color-mix(in lab, red, red)){.border-border\\/60{border-color:color-mix(in oklab, var(--border) 60%, transparent)}}.border-input{border-color:var(--input)}.border-ring{border-color:var(--ring)}.border-transparent{border-color:#0000}.bg-background{background-color:var(--background)}.bg-black{background-color:var(--color-black)}.bg-black\\/10{background-color:#0000001a}@supports (color:color-mix(in lab, red, red)){.bg-black\\/10{background-color:color-mix(in oklab, var(--color-black) 10%, transparent)}}.bg-border{background-color:var(--border)}.bg-card{background-color:var(--card)}.bg-destructive,.bg-destructive\\/10{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.bg-destructive\\/10{background-color:color-mix(in oklab, var(--destructive) 10%, transparent)}}.bg-foreground{background-color:var(--foreground)}.bg-input{background-color:var(--input)}.bg-muted{background-color:var(--muted)}.bg-muted-foreground{background-color:var(--muted-foreground)}.bg-muted\\/40{background-color:var(--muted)}@supports (color:color-mix(in lab, red, red)){.bg-muted\\/40{background-color:color-mix(in oklab, var(--muted) 40%, transparent)}}.bg-muted\\/50{background-color:var(--muted)}@supports (color:color-mix(in lab, red, red)){.bg-muted\\/50{background-color:color-mix(in oklab, var(--muted) 50%, transparent)}}.bg-popover{background-color:var(--popover)}.bg-primary{background-color:var(--primary)}.bg-primary-foreground,.bg-primary-foreground\\/15{background-color:var(--primary-foreground)}@supports (color:color-mix(in lab, red, red)){.bg-primary-foreground\\/15{background-color:color-mix(in oklab, var(--primary-foreground) 15%, transparent)}}.bg-ring{background-color:var(--ring)}.bg-secondary{background-color:var(--secondary)}.bg-transparent{background-color:#0000}.bg-warning,.bg-warning\\/10{background-color:var(--warning)}@supports (color:color-mix(in lab, red, red)){.bg-warning\\/10{background-color:color-mix(in oklab, var(--warning) 10%, transparent)}}.bg-clip-padding{background-clip:padding-box}.bg-repeat{background-repeat:repeat}.mask-no-clip{-webkit-mask-clip:no-clip;mask-clip:no-clip}.mask-repeat{-webkit-mask-repeat:repeat;mask-repeat:repeat}.p-\\(--card-spacing\\){padding:var(--card-spacing)}.p-0{padding:0}.p-1{padding:var(--spacing)}.p-4{padding:calc(var(--spacing) * 4)}.px-\\(--card-spacing\\){padding-inline:var(--card-spacing)}.px-1{padding-inline:var(--spacing)}.px-1\\.5{padding-inline:calc(var(--spacing) * 1.5)}.px-2{padding-inline:calc(var(--spacing) * 2)}.px-2\\.5{padding-inline:calc(var(--spacing) * 2.5)}.px-3{padding-inline:calc(var(--spacing) * 3)}.px-3\\.5{padding-inline:calc(var(--spacing) * 3.5)}.px-4{padding-inline:calc(var(--spacing) * 4)}.px-6{padding-inline:calc(var(--spacing) * 6)}.py-\\(--card-spacing\\){padding-block:var(--card-spacing)}.py-1{padding-block:var(--spacing)}.py-1\\.5{padding-block:calc(var(--spacing) * 1.5)}.py-2{padding-block:calc(var(--spacing) * 2)}.py-2\\.5{padding-block:calc(var(--spacing) * 2.5)}.py-3{padding-block:calc(var(--spacing) * 3)}.py-4{padding-block:calc(var(--spacing) * 4)}.py-5{padding-block:calc(var(--spacing) * 5)}.py-6{padding-block:calc(var(--spacing) * 6)}.py-10{padding-block:calc(var(--spacing) * 10)}.pt-0{padding-top:0}.pt-1{padding-top:var(--spacing)}.pt-1\\.5{padding-top:calc(var(--spacing) * 1.5)}.pt-2{padding-top:calc(var(--spacing) * 2)}.pt-3{padding-top:calc(var(--spacing) * 3)}.pt-3\\.5{padding-top:calc(var(--spacing) * 3.5)}.pt-5{padding-top:calc(var(--spacing) * 5)}.pt-8{padding-top:calc(var(--spacing) * 8)}.pt-16{padding-top:calc(var(--spacing) * 16)}.pr-1{padding-right:var(--spacing)}.pr-1\\.5{padding-right:calc(var(--spacing) * 1.5)}.pr-2{padding-right:calc(var(--spacing) * 2)}.pr-2\\.5{padding-right:calc(var(--spacing) * 2.5)}.pr-3{padding-right:calc(var(--spacing) * 3)}.pr-4{padding-right:calc(var(--spacing) * 4)}.pr-8{padding-right:calc(var(--spacing) * 8)}.pr-12{padding-right:calc(var(--spacing) * 12)}.pb-0{padding-bottom:0}.pb-1{padding-bottom:var(--spacing)}.pb-1\\.5{padding-bottom:calc(var(--spacing) * 1.5)}.pb-2{padding-bottom:calc(var(--spacing) * 2)}.pb-2\\.5{padding-bottom:calc(var(--spacing) * 2.5)}.pb-3{padding-bottom:calc(var(--spacing) * 3)}.pb-4{padding-bottom:calc(var(--spacing) * 4)}.pb-6{padding-bottom:calc(var(--spacing) * 6)}.pb-12{padding-bottom:calc(var(--spacing) * 12)}.pl-1{padding-left:var(--spacing)}.pl-1\\.5{padding-left:calc(var(--spacing) * 1.5)}.pl-2{padding-left:calc(var(--spacing) * 2)}.pl-2\\.5{padding-left:calc(var(--spacing) * 2.5)}.pl-3{padding-left:calc(var(--spacing) * 3)}.pl-4{padding-left:calc(var(--spacing) * 4)}.pl-6{padding-left:calc(var(--spacing) * 6)}.text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}.font-heading{font-family:var(--font-sans)}.font-mono{font-family:Geist Mono Variable,ui-monospace,SFMono-Regular,Menlo,monospace}.font-sans{font-family:Geist Variable,ui-sans-serif,system-ui,sans-serif}.text-2xl{font-size:var(--text-2xl);line-height:var(--tw-leading,var(--text-2xl--line-height))}.text-base{font-size:var(--text-base);line-height:var(--tw-leading,var(--text-base--line-height))}.text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.text-xs{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}.text-\\[0\\.8rem\\]{font-size:.8rem}.text-\\[0\\.6875rem\\]{font-size:.6875rem}.text-\\[0\\.8125rem\\]{font-size:.8125rem}.leading-4{--tw-leading:calc(var(--spacing) * 4);line-height:calc(var(--spacing) * 4)}.leading-5{--tw-leading:calc(var(--spacing) * 5);line-height:calc(var(--spacing) * 5)}.leading-6{--tw-leading:calc(var(--spacing) * 6);line-height:calc(var(--spacing) * 6)}.leading-\\[1\\.125rem\\]{--tw-leading:1.125rem;line-height:1.125rem}.leading-none{--tw-leading:1;line-height:1}.leading-snug{--tw-leading:var(--leading-snug);line-height:var(--leading-snug)}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.font-normal{--tw-font-weight:var(--font-weight-normal);font-weight:var(--font-weight-normal)}.font-semibold{--tw-font-weight:var(--font-weight-semibold);font-weight:var(--font-weight-semibold)}.tracking-normal{--tw-tracking:var(--tracking-normal);letter-spacing:var(--tracking-normal)}.tracking-tight{--tw-tracking:var(--tracking-tight);letter-spacing:var(--tracking-tight)}.tracking-widest{--tw-tracking:var(--tracking-widest);letter-spacing:var(--tracking-widest)}.text-balance{text-wrap:balance}.text-wrap{text-wrap:wrap}.break-all{word-break:break-all}.text-clip{text-overflow:clip}.text-ellipsis{text-overflow:ellipsis}.whitespace-nowrap{white-space:nowrap}.text-card-foreground{color:var(--card-foreground)}.text-current{color:currentColor}.text-destructive{color:var(--destructive)}.text-foreground,.text-foreground\\/70{color:var(--foreground)}@supports (color:color-mix(in lab, red, red)){.text-foreground\\/70{color:color-mix(in oklab, var(--foreground) 70%, transparent)}}.text-foreground\\/80{color:var(--foreground)}@supports (color:color-mix(in lab, red, red)){.text-foreground\\/80{color:color-mix(in oklab, var(--foreground) 80%, transparent)}}.text-muted-foreground,.text-muted-foreground\\/40{color:var(--muted-foreground)}@supports (color:color-mix(in lab, red, red)){.text-muted-foreground\\/40{color:color-mix(in oklab, var(--muted-foreground) 40%, transparent)}}.text-popover-foreground{color:var(--popover-foreground)}.text-primary{color:var(--primary)}.text-primary-foreground{color:var(--primary-foreground)}.text-primary-foreground\\!{color:var(--primary-foreground)!important}.text-ring{color:var(--ring)}.text-secondary-foreground{color:var(--secondary-foreground)}.text-warning{color:var(--warning)}.capitalize{text-transform:capitalize}.lowercase{text-transform:lowercase}.normal-case{text-transform:none}.uppercase{text-transform:uppercase}.italic{font-style:italic}.not-italic{font-style:normal}.diagonal-fractions{--tw-numeric-fraction:diagonal-fractions;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.lining-nums{--tw-numeric-figure:lining-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.oldstyle-nums{--tw-numeric-figure:oldstyle-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.ordinal{--tw-ordinal:ordinal;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.proportional-nums{--tw-numeric-spacing:proportional-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.slashed-zero{--tw-slashed-zero:slashed-zero;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.stacked-fractions{--tw-numeric-fraction:stacked-fractions;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.tabular-nums{--tw-numeric-spacing:tabular-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.normal-nums{font-variant-numeric:normal}.line-through{text-decoration-line:line-through}.no-underline{text-decoration-line:none}.overline{text-decoration-line:overline}.underline{text-decoration-line:underline}.underline-offset-4{text-underline-offset:4px}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.subpixel-antialiased{-webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto}.opacity-0{opacity:0}.opacity-50{opacity:.5}.opacity-60{opacity:.6}.opacity-70{opacity:.7}.opacity-100{opacity:1}.shadow{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-\\[0_0_0_0\\.0625rem\\]{--tw-shadow:0 0 0 .0625rem var(--tw-shadow-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-\\[0_1\\.5rem_3rem_-1rem_rgb\\(0_0_0\\/0\\.22\\)\\]{--tw-shadow:0 1.5rem 3rem -1rem var(--tw-shadow-color,#00000038);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-md{--tw-shadow:0 4px 6px -1px var(--tw-shadow-color,#0000001a), 0 2px 4px -2px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-none{--tw-shadow:0 0 #0000;box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring-0{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring-1{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.inset-ring{--tw-inset-ring-shadow:inset 0 0 0 1px var(--tw-inset-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-foreground{--tw-shadow-color:var(--foreground)}@supports (color:color-mix(in lab, red, red)){.shadow-foreground{--tw-shadow-color:color-mix(in oklab, var(--foreground) var(--tw-shadow-alpha), transparent)}}.shadow-foreground\\/12{--tw-shadow-color:var(--foreground)}@supports (color:color-mix(in lab, red, red)){.shadow-foreground\\/12{--tw-shadow-color:color-mix(in oklab, color-mix(in oklab, var(--foreground) 12%, transparent) var(--tw-shadow-alpha), transparent)}}.ring-border{--tw-ring-color:var(--border)}.ring-foreground,.ring-foreground\\/10{--tw-ring-color:var(--foreground)}@supports (color:color-mix(in lab, red, red)){.ring-foreground\\/10{--tw-ring-color:color-mix(in oklab, var(--foreground) 10%, transparent)}}.outline-hidden{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.outline-hidden{outline-offset:2px;outline:2px solid #0000}}.outline{outline-style:var(--tw-outline-style);outline-width:1px}.blur{--tw-blur:blur(8px);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.drop-shadow{--tw-drop-shadow-size:drop-shadow(0 1px 2px var(--tw-drop-shadow-color,#0000001a)) drop-shadow(0 1px 1px var(--tw-drop-shadow-color,#0000000f));--tw-drop-shadow:drop-shadow(0 1px 2px #0000001a) drop-shadow(0 1px 1px #0000000f);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.grayscale{--tw-grayscale:grayscale(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.invert{--tw-invert:invert(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.sepia{--tw-sepia:sepia(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.filter{filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.backdrop-blur{--tw-backdrop-blur:blur(8px);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-grayscale{--tw-backdrop-grayscale:grayscale(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-invert{--tw-backdrop-invert:invert(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-sepia{--tw-backdrop-sepia:sepia(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-filter{-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.transition{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter,display,content-visibility,overlay,pointer-events;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-\\[width\\]{transition-property:width;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-colors{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-opacity{transition-property:opacity;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-transform{transition-property:transform,translate,scale,rotate;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.duration-100{--tw-duration:.1s;transition-duration:.1s}.duration-150{--tw-duration:.15s;transition-duration:.15s}.duration-200{--tw-duration:.2s;transition-duration:.2s}.duration-300{--tw-duration:.3s;transition-duration:.3s}.duration-400{--tw-duration:.4s;transition-duration:.4s}.duration-500{--tw-duration:.5s;transition-duration:.5s}.ease-in-out{--tw-ease:var(--ease-in-out);transition-timing-function:var(--ease-in-out)}.ease-out{--tw-ease:var(--ease-out);transition-timing-function:var(--ease-out)}.ease-out-expo{--tw-ease:cubic-bezier(.16, 1, .3, 1);transition-timing-function:cubic-bezier(.16,1,.3,1)}.fade-in-0{--tw-enter-opacity:0}.outline-none{--tw-outline-style:none;outline-style:none}.select-none{-webkit-user-select:none;user-select:none}.zoom-in-90{--tw-enter-scale:.9}.\\[--card-spacing\\:--spacing\\(4\\)\\]{--card-spacing:calc(var(--spacing) * 4)}:where(.divide-x-reverse>:not(:last-child)){--tw-divide-x-reverse:1}.paused{animation-play-state:paused}.ring-inset{--tw-ring-inset:inset}.running{animation-play-state:running}.slide-in-from-top-1{--tw-enter-translate-y:calc(1*var(--spacing)*-1)}.zoom-in{--tw-enter-scale:0}.zoom-out{--tw-exit-scale:0}.group-focus-within\\/row\\:opacity-100:is(:where(.group\\/row):focus-within *){opacity:1}@media (hover:hover){.group-hover\\/row\\:opacity-100:is(:where(.group\\/row):hover *){opacity:1}}.group-has-data-\\[slot\\=command-checkbox\\]\\/command-item\\:hidden:is(:where(.group\\/command-item):has([data-slot=command-checkbox]) *),.group-has-data-\\[slot\\=command-shortcut\\]\\/command-item\\:hidden:is(:where(.group\\/command-item):has([data-slot=command-shortcut]) *){display:none}.group-has-\\[\\>input\\]\\/input-group\\:pt-2:is(:where(.group\\/input-group):has(>input) *){padding-top:calc(var(--spacing) * 2)}.group-has-\\[\\>input\\]\\/input-group\\:pb-2:is(:where(.group\\/input-group):has(>input) *){padding-bottom:calc(var(--spacing) * 2)}.group-has-\\[\\>svg\\]\\/alert\\:col-start-2:is(:where(.group\\/alert):has(>svg) *){grid-column-start:2}.group-data-\\[checked\\=true\\]\\/command-item\\:animate-check-in:is(:where(.group\\/command-item)[data-checked=true] *){animation:.22s cubic-bezier(.16,1,.3,1) both s4e-check-in}.group-data-\\[checked\\=true\\]\\/command-item\\:border-primary:is(:where(.group\\/command-item)[data-checked=true] *){border-color:var(--primary)}.group-data-\\[checked\\=true\\]\\/command-item\\:bg-primary:is(:where(.group\\/command-item)[data-checked=true] *){background-color:var(--primary)}.group-data-\\[checked\\=true\\]\\/command-item\\:opacity-100:is(:where(.group\\/command-item)[data-checked=true] *){opacity:1}.group-data-\\[disabled\\=true\\]\\:pointer-events-none:is(:where(.group)[data-disabled=true] *){pointer-events:none}.group-data-\\[disabled\\=true\\]\\:opacity-50:is(:where(.group)[data-disabled=true] *),.group-data-\\[disabled\\=true\\]\\/input-group\\:opacity-50:is(:where(.group\\/input-group)[data-disabled=true] *){opacity:.5}.group-data-\\[size\\=default\\]\\/switch\\:size-4:is(:where(.group\\/switch)[data-size=default] *){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.group-data-\\[size\\=sm\\]\\/alert-dialog-content\\:grid:is(:where(.group\\/alert-dialog-content)[data-size=sm] *){display:grid}.group-data-\\[size\\=sm\\]\\/alert-dialog-content\\:grid-cols-2:is(:where(.group\\/alert-dialog-content)[data-size=sm] *){grid-template-columns:repeat(2,minmax(0,1fr))}.group-data-\\[size\\=sm\\]\\/card\\:text-sm:is(:where(.group\\/card)[data-size=sm] *){font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.group-data-\\[size\\=sm\\]\\/switch\\:size-3:is(:where(.group\\/switch)[data-size=sm] *){width:calc(var(--spacing) * 3);height:calc(var(--spacing) * 3)}.group-data-selected\\/command-item\\:text-foreground:is(:where(.group\\/command-item):where([data-selected=true]) *){color:var(--foreground)}.group-data-selected\\/command-item\\:opacity-100:is(:where(.group\\/command-item):where([data-selected=true]) *){opacity:1}.peer-disabled\\:cursor-not-allowed:is(:where(.peer):disabled~*){cursor:not-allowed}.peer-disabled\\:opacity-50:is(:where(.peer):disabled~*){opacity:.5}.file\\:inline-flex::file-selector-button{display:inline-flex}.file\\:h-6::file-selector-button{height:calc(var(--spacing) * 6)}.file\\:border-0::file-selector-button{border-style:var(--tw-border-style);border-width:0}.file\\:bg-transparent::file-selector-button{background-color:#0000}.file\\:text-sm::file-selector-button{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.file\\:font-medium::file-selector-button{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.file\\:text-foreground::file-selector-button{color:var(--foreground)}.placeholder\\:font-sans::placeholder{font-family:Geist Variable,ui-sans-serif,system-ui,sans-serif}.placeholder\\:text-muted-foreground::placeholder{color:var(--muted-foreground)}.after\\:absolute:after{content:var(--tw-content);position:absolute}.after\\:-inset-x-3:after{content:var(--tw-content);inset-inline:calc(var(--spacing) * -3)}.after\\:-inset-y-2:after{content:var(--tw-content);inset-block:calc(var(--spacing) * -2)}.first\\:border-t-0:first-child{border-top-style:var(--tw-border-style);border-top-width:0}@media (hover:hover){.hover\\:bg-\\[color-mix\\(in_oklch\\,var\\(--secondary\\)\\,var\\(--foreground\\)_5\\%\\)\\]:hover{background-color:var(--secondary)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-\\[color-mix\\(in_oklch\\,var\\(--secondary\\)\\,var\\(--foreground\\)_5\\%\\)\\]:hover{background-color:color-mix(in oklch,var(--secondary),var(--foreground) 5%)}}.hover\\:bg-background\\/60:hover{background-color:var(--background)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-background\\/60:hover{background-color:color-mix(in oklab, var(--background) 60%, transparent)}}.hover\\:bg-destructive\\/10:hover{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-destructive\\/10:hover{background-color:color-mix(in oklab, var(--destructive) 10%, transparent)}}.hover\\:bg-destructive\\/20:hover{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-destructive\\/20:hover{background-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.hover\\:bg-foreground\\/5:hover{background-color:var(--foreground)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-foreground\\/5:hover{background-color:color-mix(in oklab, var(--foreground) 5%, transparent)}}.hover\\:bg-muted:hover{background-color:var(--muted)}.hover\\:bg-primary\\/80:hover{background-color:var(--primary)}@supports (color:color-mix(in lab, red, red)){.hover\\:bg-primary\\/80:hover{background-color:color-mix(in oklab, var(--primary) 80%, transparent)}}.hover\\:text-destructive:hover{color:var(--destructive)}.hover\\:text-foreground:hover{color:var(--foreground)}.hover\\:underline:hover{text-decoration-line:underline}.hover\\:opacity-100:hover{opacity:1}}.focus\\:bg-accent:focus{background-color:var(--accent)}.focus\\:text-accent-foreground:focus,:is(.not-data-\\[variant\\=destructive\\]\\:focus\\:\\*\\*\\:text-accent-foreground:not([data-variant=destructive]):focus *){color:var(--accent-foreground)}.focus-visible\\:border-destructive\\/40:focus-visible{border-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.focus-visible\\:border-destructive\\/40:focus-visible{border-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.focus-visible\\:border-ring:focus-visible{border-color:var(--ring)}.focus-visible\\:bg-muted:focus-visible{background-color:var(--muted)}.focus-visible\\:text-foreground:focus-visible{color:var(--foreground)}.focus-visible\\:ring-0:focus-visible{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.focus-visible\\:ring-3:focus-visible{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.focus-visible\\:ring-destructive\\/20:focus-visible{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.focus-visible\\:ring-destructive\\/20:focus-visible{--tw-ring-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.focus-visible\\:ring-ring\\/35:focus-visible{--tw-ring-color:var(--ring)}@supports (color:color-mix(in lab, red, red)){.focus-visible\\:ring-ring\\/35:focus-visible{--tw-ring-color:color-mix(in oklab, var(--ring) 35%, transparent)}}.focus-visible\\:ring-ring\\/50:focus-visible{--tw-ring-color:var(--ring)}@supports (color:color-mix(in lab, red, red)){.focus-visible\\:ring-ring\\/50:focus-visible{--tw-ring-color:color-mix(in oklab, var(--ring) 50%, transparent)}}.active\\:not-aria-\\[haspopup\\]\\:translate-y-0:active:not([aria-haspopup]){--tw-translate-y:0px;translate:var(--tw-translate-x) var(--tw-translate-y)}.active\\:not-aria-\\[haspopup\\]\\:translate-y-px:active:not([aria-haspopup]){--tw-translate-y:1px;translate:var(--tw-translate-x) var(--tw-translate-y)}.disabled\\:pointer-events-none:disabled{pointer-events:none}.disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}.disabled\\:bg-input\\/50:disabled{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.disabled\\:bg-input\\/50:disabled{background-color:color-mix(in oklab, var(--input) 50%, transparent)}}.disabled\\:bg-transparent:disabled{background-color:#0000}.disabled\\:opacity-50:disabled{opacity:.5}:where([data-slot=button-group]) .in-data-\\[slot\\=button-group\\]\\:rounded-lg{border-radius:var(--radius)}:where([data-slot=combobox-content]) .in-data-\\[slot\\=combobox-content\\]\\:focus-within\\:border-inherit:focus-within{border-color:inherit}:where([data-slot=combobox-content]) .in-data-\\[slot\\=combobox-content\\]\\:focus-within\\:ring-0:focus-within{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.has-disabled\\:bg-input\\/50:has(:disabled){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.has-disabled\\:bg-input\\/50:has(:disabled){background-color:color-mix(in oklab, var(--input) 50%, transparent)}}.has-disabled\\:opacity-50:has(:disabled){opacity:.5}.has-data-\\[icon\\=inline-end\\]\\:pr-1\\.5:has([data-icon=inline-end]){padding-right:calc(var(--spacing) * 1.5)}.has-data-\\[icon\\=inline-end\\]\\:pr-2:has([data-icon=inline-end]){padding-right:calc(var(--spacing) * 2)}.has-data-\\[icon\\=inline-start\\]\\:pl-1\\.5:has([data-icon=inline-start]){padding-left:calc(var(--spacing) * 1.5)}.has-data-\\[icon\\=inline-start\\]\\:pl-2:has([data-icon=inline-start]){padding-left:calc(var(--spacing) * 2)}.has-data-\\[slot\\=alert-action\\]\\:relative:has([data-slot=alert-action]){position:relative}.has-data-\\[slot\\=alert-action\\]\\:pr-18:has([data-slot=alert-action]){padding-right:calc(var(--spacing) * 18)}.has-data-\\[slot\\=alert-dialog-media\\]\\:grid-rows-\\[auto_auto_1fr\\]:has([data-slot=alert-dialog-media]){grid-template-rows:auto auto 1fr}.has-data-\\[slot\\=alert-dialog-media\\]\\:gap-x-4:has([data-slot=alert-dialog-media]){column-gap:calc(var(--spacing) * 4)}.has-data-\\[slot\\=card-action\\]\\:grid-cols-\\[1fr_auto\\]:has([data-slot=card-action]){grid-template-columns:1fr auto}.has-data-\\[slot\\=card-description\\]\\:grid-rows-\\[auto_auto\\]:has([data-slot=card-description]){grid-template-rows:auto auto}.has-data-\\[slot\\=card-footer\\]\\:pb-0:has([data-slot=card-footer]){padding-bottom:0}.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:border-ring:has([data-slot=input-group-control]:focus-visible){border-color:var(--ring)}.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:ring-3:has([data-slot=input-group-control]:focus-visible){--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:ring-ring\\/50:has([data-slot=input-group-control]:focus-visible){--tw-ring-color:var(--ring)}@supports (color:color-mix(in lab, red, red)){.has-\\[\\[data-slot\\=input-group-control\\]\\:focus-visible\\]\\:ring-ring\\/50:has([data-slot=input-group-control]:focus-visible){--tw-ring-color:color-mix(in oklab, var(--ring) 50%, transparent)}}.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:border-destructive:has([data-slot][aria-invalid=true]){border-color:var(--destructive)}.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-3:has([data-slot][aria-invalid=true]){--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/20:has([data-slot][aria-invalid=true]){--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/20:has([data-slot][aria-invalid=true]){--tw-ring-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.has-\\[\\>\\[data-align\\=block-end\\]\\]\\:h-auto:has(>[data-align=block-end]){height:auto}.has-\\[\\>\\[data-align\\=block-end\\]\\]\\:flex-col:has(>[data-align=block-end]){flex-direction:column}.has-\\[\\>\\[data-align\\=block-start\\]\\]\\:h-auto:has(>[data-align=block-start]){height:auto}.has-\\[\\>\\[data-align\\=block-start\\]\\]\\:flex-col:has(>[data-align=block-start]){flex-direction:column}.has-\\[\\>button\\]\\:mr-\\[-0\\.3rem\\]:has(>button){margin-right:-.3rem}.has-\\[\\>button\\]\\:ml-\\[-0\\.3rem\\]:has(>button){margin-left:-.3rem}.has-\\[\\>img\\:first-child\\]\\:pt-0:has(>img:first-child){padding-top:0}.has-\\[\\>kbd\\]\\:mr-\\[-0\\.15rem\\]:has(>kbd){margin-right:-.15rem}.has-\\[\\>kbd\\]\\:ml-\\[-0\\.15rem\\]:has(>kbd){margin-left:-.15rem}.has-\\[\\>svg\\]\\:grid-cols-\\[auto_1fr\\]:has(>svg){grid-template-columns:auto 1fr}.has-\\[\\>svg\\]\\:gap-x-2:has(>svg){column-gap:calc(var(--spacing) * 2)}.has-\\[\\>svg\\]\\:p-0:has(>svg){padding:0}.has-\\[\\>textarea\\]\\:h-auto:has(>textarea){height:auto}.aria-expanded\\:bg-muted[aria-expanded=true]{background-color:var(--muted)}.aria-expanded\\:bg-secondary[aria-expanded=true]{background-color:var(--secondary)}.aria-expanded\\:text-foreground[aria-expanded=true]{color:var(--foreground)}.aria-expanded\\:text-secondary-foreground[aria-expanded=true]{color:var(--secondary-foreground)}.aria-invalid\\:border-destructive[aria-invalid=true]{border-color:var(--destructive)}.aria-invalid\\:ring-0[aria-invalid=true]{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.aria-invalid\\:ring-3[aria-invalid=true]{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.aria-invalid\\:ring-destructive\\/20[aria-invalid=true]{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.aria-invalid\\:ring-destructive\\/20[aria-invalid=true]{--tw-ring-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.data-placeholder\\:text-muted-foreground[data-placeholder]{color:var(--muted-foreground)}.data-\\[align-trigger\\=true\\]\\:animate-none[data-align-trigger=true]{animation:none}.data-\\[disabled\\=true\\]\\:pointer-events-none[data-disabled=true]{pointer-events:none}.data-\\[disabled\\=true\\]\\:opacity-50[data-disabled=true]{opacity:.5}.data-\\[position\\=popper\\]\\:h-\\(--radix-select-trigger-height\\)[data-position=popper]{height:var(--radix-select-trigger-height)}.data-\\[position\\=popper\\]\\:w-full[data-position=popper]{width:100%}.data-\\[position\\=popper\\]\\:min-w-\\(--radix-select-trigger-width\\)[data-position=popper]{min-width:var(--radix-select-trigger-width)}.data-\\[side\\=bottom\\]\\:translate-y-1[data-side=bottom]{--tw-translate-y:var(--spacing);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=bottom\\]\\:slide-in-from-top-2[data-side=bottom]{--tw-enter-translate-y:calc(2*var(--spacing)*-1)}.data-\\[side\\=left\\]\\:-translate-x-1[data-side=left]{--tw-translate-x:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=left\\]\\:slide-in-from-right-2[data-side=left]{--tw-enter-translate-x:calc(2*var(--spacing))}.data-\\[side\\=right\\]\\:translate-x-1[data-side=right]{--tw-translate-x:var(--spacing);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=right\\]\\:slide-in-from-left-2[data-side=right]{--tw-enter-translate-x:calc(2*var(--spacing)*-1)}.data-\\[side\\=top\\]\\:-translate-y-1[data-side=top]{--tw-translate-y:calc(var(--spacing) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.data-\\[side\\=top\\]\\:slide-in-from-bottom-2[data-side=top]{--tw-enter-translate-y:calc(2*var(--spacing))}.data-\\[size\\=default\\]\\:h-8[data-size=default]{height:calc(var(--spacing) * 8)}.data-\\[size\\=default\\]\\:h-\\[18\\.4px\\][data-size=default]{height:18.4px}.data-\\[size\\=default\\]\\:w-\\[32px\\][data-size=default]{width:32px}.data-\\[size\\=default\\]\\:max-w-xs[data-size=default]{max-width:var(--container-xs)}.data-\\[size\\=sm\\]\\:h-7[data-size=sm]{height:calc(var(--spacing) * 7)}.data-\\[size\\=sm\\]\\:h-\\[14px\\][data-size=sm]{height:14px}.data-\\[size\\=sm\\]\\:w-\\[24px\\][data-size=sm]{width:24px}.data-\\[size\\=sm\\]\\:max-w-xs[data-size=sm]{max-width:var(--container-xs)}.data-\\[size\\=sm\\]\\:rounded-\\[min\\(var\\(--radius-md\\)\\,10px\\)\\][data-size=sm]{border-radius:min(var(--radius-md), 10px)}.data-\\[size\\=sm\\]\\:\\[--card-spacing\\:--spacing\\(3\\)\\][data-size=sm]{--card-spacing:calc(var(--spacing) * 3)}.data-\\[size\\=sm\\]\\:has-data-\\[slot\\=card-footer\\]\\:pb-0[data-size=sm]:has([data-slot=card-footer]){padding-bottom:0}:is(.\\*\\:data-\\[slot\\=alert-description\\]\\:text-destructive\\/90>*)[data-slot=alert-description]{color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){:is(.\\*\\:data-\\[slot\\=alert-description\\]\\:text-destructive\\/90>*)[data-slot=alert-description]{color:color-mix(in oklab, var(--destructive) 90%, transparent)}}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:line-clamp-1>*)[data-slot=select-value]{-webkit-line-clamp:1;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:flex>*)[data-slot=select-value]{display:flex}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:items-center>*)[data-slot=select-value]{align-items:center}:is(.\\*\\:data-\\[slot\\=select-value\\]\\:gap-1\\.5>*)[data-slot=select-value]{gap:calc(var(--spacing) * 1.5)}.data-\\[value\\=__blank__\\]\\:text-muted-foreground[data-value=blank]{color:var(--muted-foreground)}@supports ((-webkit-backdrop-filter:var(--tw)) or (backdrop-filter:var(--tw))){.supports-backdrop-filter\\:backdrop-blur-xs{--tw-backdrop-blur:blur(var(--blur-xs));-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}}@media (prefers-reduced-motion:reduce){.motion-reduce\\:hidden{display:none}.motion-reduce\\:animate-none{animation:none}.motion-reduce\\:animate-none\\!{animation:none!important}.motion-reduce\\:transition-none{transition-property:none}}@media (width>=40rem){.sm\\:w-52{width:calc(var(--spacing) * 52)}.sm\\:w-64{width:calc(var(--spacing) * 64)}.sm\\:max-w-\\[30rem\\]{max-width:30rem}.sm\\:max-w-\\[35rem\\]{max-width:35rem}.sm\\:max-w-sm{max-width:var(--container-sm)}.sm\\:flex-none{flex:none}.sm\\:flex-row{flex-direction:row}.sm\\:items-center{align-items:center}.sm\\:justify-end{justify-content:flex-end}.sm\\:gap-4{gap:calc(var(--spacing) * 4)}.sm\\:py-2{padding-block:calc(var(--spacing) * 2)}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:row-span-2:is(:where(.group\\/alert-dialog-content)[data-size=default] *){grid-row:span 2/span 2}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:place-items-start:is(:where(.group\\/alert-dialog-content)[data-size=default] *){place-items:start}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:text-left:is(:where(.group\\/alert-dialog-content)[data-size=default] *){text-align:left}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:group-has-data-\\[slot\\=alert-dialog-media\\]\\/alert-dialog-content\\:col-start-2:is(:where(.group\\/alert-dialog-content)[data-size=default] *):is(:where(.group\\/alert-dialog-content):has([data-slot=alert-dialog-media]) *){grid-column-start:2}.sm\\:group-data-\\[size\\=default\\]\\/alert-dialog-content\\:has-data-\\[slot\\=alert-dialog-media\\]\\:grid-rows-\\[auto_1fr\\]:is(:where(.group\\/alert-dialog-content)[data-size=default] *):has([data-slot=alert-dialog-media]){grid-template-rows:auto 1fr}.data-\\[size\\=default\\]\\:sm\\:max-w-\\[26rem\\][data-size=default]{max-width:26rem}.data-\\[size\\=default\\]\\:sm\\:max-w-sm[data-size=default]{max-width:var(--container-sm)}}@media (width>=48rem){.md\\:text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.md\\:text-pretty{text-wrap:pretty}}.dark\\:border-input:is(.dark *),:host(.dark) .dark\\:border-input{border-color:var(--input)}.dark\\:bg-background:is(.dark *),:host(.dark) .dark\\:bg-background{background-color:var(--background)}.dark\\:bg-destructive\\/20:is(.dark *){background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:bg-destructive\\/20:is(.dark *){background-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}:host(.dark) .dark\\:bg-destructive\\/20{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:bg-destructive\\/20{background-color:color-mix(in oklab, var(--destructive) 20%, transparent)}}.dark\\:bg-input\\/30:is(.dark *){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:bg-input\\/30:is(.dark *){background-color:color-mix(in oklab, var(--input) 30%, transparent)}}:host(.dark) .dark\\:bg-input\\/30{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:bg-input\\/30{background-color:color-mix(in oklab, var(--input) 30%, transparent)}}.dark\\:bg-transparent:is(.dark *),:host(.dark) .dark\\:bg-transparent{background-color:#0000}.dark\\:group-data-\\[checked\\=true\\]\\/command-item\\:bg-primary:is(.dark *):is(:where(.group\\/command-item)[data-checked=true] *),:host(.dark) .dark\\:group-data-\\[checked\\=true\\]\\/command-item\\:bg-primary:is(:where(.group\\/command-item)[data-checked=true] *){background-color:var(--primary)}@media (hover:hover){.dark\\:hover\\:bg-destructive\\/30:is(.dark *):hover{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:hover\\:bg-destructive\\/30:is(.dark *):hover{background-color:color-mix(in oklab, var(--destructive) 30%, transparent)}}:host(.dark) .dark\\:hover\\:bg-destructive\\/30:hover{background-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:hover\\:bg-destructive\\/30:hover{background-color:color-mix(in oklab, var(--destructive) 30%, transparent)}}.dark\\:hover\\:bg-input\\/50:is(.dark *):hover{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:hover\\:bg-input\\/50:is(.dark *):hover{background-color:color-mix(in oklab, var(--input) 50%, transparent)}}:host(.dark) .dark\\:hover\\:bg-input\\/50:hover{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:hover\\:bg-input\\/50:hover{background-color:color-mix(in oklab, var(--input) 50%, transparent)}}.dark\\:hover\\:bg-muted\\/50:is(.dark *):hover{background-color:var(--muted)}@supports (color:color-mix(in lab, red, red)){.dark\\:hover\\:bg-muted\\/50:is(.dark *):hover{background-color:color-mix(in oklab, var(--muted) 50%, transparent)}}:host(.dark) .dark\\:hover\\:bg-muted\\/50:hover{background-color:var(--muted)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:hover\\:bg-muted\\/50:hover{background-color:color-mix(in oklab, var(--muted) 50%, transparent)}}}.dark\\:focus-visible\\:ring-destructive\\/40:is(.dark *):focus-visible{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:focus-visible\\:ring-destructive\\/40:is(.dark *):focus-visible{--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}:host(.dark) .dark\\:focus-visible\\:ring-destructive\\/40:focus-visible{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:focus-visible\\:ring-destructive\\/40:focus-visible{--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.dark\\:disabled\\:bg-input\\/80:is(.dark *):disabled{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:disabled\\:bg-input\\/80:is(.dark *):disabled{background-color:color-mix(in oklab, var(--input) 80%, transparent)}}:host(.dark) .dark\\:disabled\\:bg-input\\/80:disabled{background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:disabled\\:bg-input\\/80:disabled{background-color:color-mix(in oklab, var(--input) 80%, transparent)}}.dark\\:disabled\\:bg-transparent:is(.dark *):disabled,:host(.dark) .dark\\:disabled\\:bg-transparent:disabled{background-color:#0000}.dark\\:has-disabled\\:bg-input\\/80:is(.dark *):has(:disabled){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:has-disabled\\:bg-input\\/80:is(.dark *):has(:disabled){background-color:color-mix(in oklab, var(--input) 80%, transparent)}}:host(.dark) .dark\\:has-disabled\\:bg-input\\/80:has(:disabled){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:has-disabled\\:bg-input\\/80:has(:disabled){background-color:color-mix(in oklab, var(--input) 80%, transparent)}}.dark\\:has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/40:is(.dark *):has([data-slot][aria-invalid=true]){--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/40:is(.dark *):has([data-slot][aria-invalid=true]){--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}:host(.dark) .dark\\:has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/40:has([data-slot][aria-invalid=true]){--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:has-\\[\\[data-slot\\]\\[aria-invalid\\=true\\]\\]\\:ring-destructive\\/40:has([data-slot][aria-invalid=true]){--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.dark\\:aria-invalid\\:border-destructive\\/50:is(.dark *)[aria-invalid=true]{border-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:aria-invalid\\:border-destructive\\/50:is(.dark *)[aria-invalid=true]{border-color:color-mix(in oklab, var(--destructive) 50%, transparent)}}:host(.dark) .dark\\:aria-invalid\\:border-destructive\\/50[aria-invalid=true]{border-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:aria-invalid\\:border-destructive\\/50[aria-invalid=true]{border-color:color-mix(in oklab, var(--destructive) 50%, transparent)}}.dark\\:aria-invalid\\:ring-destructive\\/40:is(.dark *)[aria-invalid=true]{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){.dark\\:aria-invalid\\:ring-destructive\\/40:is(.dark *)[aria-invalid=true]{--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}:host(.dark) .dark\\:aria-invalid\\:ring-destructive\\/40[aria-invalid=true]{--tw-ring-color:var(--destructive)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:aria-invalid\\:ring-destructive\\/40[aria-invalid=true]{--tw-ring-color:color-mix(in oklab, var(--destructive) 40%, transparent)}}.data-open\\:animate-dialog-in:where([data-state=open]),.data-open\\:animate-dialog-in:where([data-open]:not([data-open=false])){animation:.18s cubic-bezier(.16,1,.3,1) s4e-dialog-in}.data-open\\:animate-in:where([data-state=open]),.data-open\\:animate-in:where([data-open]:not([data-open=false])){animation:enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none)}.data-open\\:animate-overlay-in:where([data-state=open]),.data-open\\:animate-overlay-in:where([data-open]:not([data-open=false])){animation:.18s cubic-bezier(.16,1,.3,1) s4e-overlay-in}.data-open\\:fade-in-0:where([data-state=open]),.data-open\\:fade-in-0:where([data-open]:not([data-open=false])){--tw-enter-opacity:0}.data-open\\:zoom-in-95:where([data-state=open]),.data-open\\:zoom-in-95:where([data-open]:not([data-open=false])){--tw-enter-scale:.95}.data-closed\\:animate-dialog-out:where([data-state=closed]),.data-closed\\:animate-dialog-out:where([data-closed]:not([data-closed=false])){animation:.12s cubic-bezier(.4,0,1,1) forwards s4e-dialog-out}.data-closed\\:animate-out:where([data-state=closed]),.data-closed\\:animate-out:where([data-closed]:not([data-closed=false])){animation:exit var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none)}.data-closed\\:animate-overlay-out:where([data-state=closed]),.data-closed\\:animate-overlay-out:where([data-closed]:not([data-closed=false])){animation:.12s cubic-bezier(.4,0,1,1) forwards s4e-overlay-out}.data-closed\\:fade-out-0:where([data-state=closed]),.data-closed\\:fade-out-0:where([data-closed]:not([data-closed=false])){--tw-exit-opacity:0}.data-closed\\:zoom-out-95:where([data-state=closed]),.data-closed\\:zoom-out-95:where([data-closed]:not([data-closed=false])){--tw-exit-scale:.95}.data-checked\\:bg-primary:where([data-state=checked]),.data-checked\\:bg-primary:where([data-checked]:not([data-checked=false])){background-color:var(--primary)}.group-data-\\[size\\=default\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=default] *):where([data-state=checked]),.group-data-\\[size\\=default\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=default] *):where([data-checked]:not([data-checked=false])),.group-data-\\[size\\=sm\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=sm] *):where([data-state=checked]),.group-data-\\[size\\=sm\\]\\/switch\\:data-checked\\:translate-x-\\[calc\\(100\\%-2px\\)\\]:is(:where(.group\\/switch)[data-size=sm] *):where([data-checked]:not([data-checked=false])){--tw-translate-x:calc(100% - 2px);translate:var(--tw-translate-x) var(--tw-translate-y)}.dark\\:data-checked\\:bg-primary-foreground:is(.dark *):where([data-state=checked]),.dark\\:data-checked\\:bg-primary-foreground:is(.dark *):where([data-checked]:not([data-checked=false])),:host(.dark) .dark\\:data-checked\\:bg-primary-foreground:where([data-state=checked]),:host(.dark) .dark\\:data-checked\\:bg-primary-foreground:where([data-checked]:not([data-checked=false])){background-color:var(--primary-foreground)}.data-unchecked\\:bg-input:where([data-state=unchecked]),.data-unchecked\\:bg-input:where([data-unchecked]:not([data-unchecked=false])){background-color:var(--input)}.group-data-\\[size\\=default\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=default] *):where([data-state=unchecked]),.group-data-\\[size\\=default\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=default] *):where([data-unchecked]:not([data-unchecked=false])),.group-data-\\[size\\=sm\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=sm] *):where([data-state=unchecked]),.group-data-\\[size\\=sm\\]\\/switch\\:data-unchecked\\:translate-x-0:is(:where(.group\\/switch)[data-size=sm] *):where([data-unchecked]:not([data-unchecked=false])){--tw-translate-x:0px;translate:var(--tw-translate-x) var(--tw-translate-y)}.dark\\:data-unchecked\\:bg-foreground:is(.dark *):where([data-state=unchecked]),.dark\\:data-unchecked\\:bg-foreground:is(.dark *):where([data-unchecked]:not([data-unchecked=false])),:host(.dark) .dark\\:data-unchecked\\:bg-foreground:where([data-state=unchecked]),:host(.dark) .dark\\:data-unchecked\\:bg-foreground:where([data-unchecked]:not([data-unchecked=false])){background-color:var(--foreground)}.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-state=unchecked]),.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-unchecked]:not([data-unchecked=false])){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-state=unchecked]),.dark\\:data-unchecked\\:bg-input\\/80:is(.dark *):where([data-unchecked]:not([data-unchecked=false])){background-color:color-mix(in oklab, var(--input) 80%, transparent)}}:host(.dark) .dark\\:data-unchecked\\:bg-input\\/80:where([data-state=unchecked]),:host(.dark) .dark\\:data-unchecked\\:bg-input\\/80:where([data-unchecked]:not([data-unchecked=false])){background-color:var(--input)}@supports (color:color-mix(in lab, red, red)){:host(.dark) .dark\\:data-unchecked\\:bg-input\\/80:where([data-state=unchecked]),:host(.dark) .dark\\:data-unchecked\\:bg-input\\/80:where([data-unchecked]:not([data-unchecked=false])){background-color:color-mix(in oklab, var(--input) 80%, transparent)}}.data-selected\\:bg-muted:where([data-selected=true]){background-color:var(--muted)}.data-selected\\:font-medium:where([data-selected=true]){--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.data-selected\\:text-foreground:where([data-selected=true]){color:var(--foreground)}:where([data-glide=on]) .in-data-\\[glide\\=on\\]\\:data-selected\\:bg-transparent\\!:where([data-selected=true]){background-color:#0000!important}.data-disabled\\:pointer-events-none:where([data-disabled=true]),.data-disabled\\:pointer-events-none:where([data-disabled]:not([data-disabled=false])){pointer-events:none}.data-disabled\\:cursor-not-allowed:where([data-disabled=true]),.data-disabled\\:cursor-not-allowed:where([data-disabled]:not([data-disabled=false])){cursor:not-allowed}.data-disabled\\:opacity-50:where([data-disabled=true]),.data-disabled\\:opacity-50:where([data-disabled]:not([data-disabled=false])){opacity:.5}.data-horizontal\\:h-px:where([data-orientation=horizontal]){height:1px}.data-horizontal\\:w-full:where([data-orientation=horizontal]){width:100%}.data-vertical\\:w-px:where([data-orientation=vertical]){width:1px}.data-vertical\\:self-stretch:where([data-orientation=vertical]){align-self:stretch}.\\[\\&_a\\]\\:underline a{text-decoration-line:underline}.\\[\\&_a\\]\\:underline-offset-3 a{text-underline-offset:3px}@media (hover:hover){.\\[\\&_a\\]\\:hover\\:text-foreground a:hover{color:var(--foreground)}}.\\[\\&_p\\:not\\(\\:last-child\\)\\]\\:mb-4 p:not(:last-child){margin-bottom:calc(var(--spacing) * 4)}.\\[\\&_svg\\]\\:pointer-events-none svg{pointer-events:none}.\\[\\&_svg\\]\\:shrink-0 svg{flex-shrink:0}.\\[\\&_svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-3 svg:not([class*=size-]){width:calc(var(--spacing) * 3);height:calc(var(--spacing) * 3)}.\\[\\&_svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-3\\.5 svg:not([class*=size-]){width:calc(var(--spacing) * 3.5);height:calc(var(--spacing) * 3.5)}.\\[\\&_svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-4 svg:not([class*=size-]){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.\\[\\.border-b\\]\\:pb-\\(--card-spacing\\).border-b{padding-bottom:var(--card-spacing)}.\\[\\.border-b\\]\\:pb-2.border-b{padding-bottom:calc(var(--spacing) * 2)}.\\[\\.border-t\\]\\:pt-2.border-t{padding-top:calc(var(--spacing) * 2)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:px-2 *)[cmdk-group-heading]{padding-inline:calc(var(--spacing) * 2)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:pt-2 *)[cmdk-group-heading]{padding-top:calc(var(--spacing) * 2)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:pb-1 *)[cmdk-group-heading]{padding-bottom:var(--spacing)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:text-xs *)[cmdk-group-heading]{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:leading-4 *)[cmdk-group-heading]{--tw-leading:calc(var(--spacing) * 4);line-height:calc(var(--spacing) * 4)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:font-medium *)[cmdk-group-heading]{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}:is(.\\*\\*\\:\\[\\[cmdk-group-heading\\]\\]\\:text-muted-foreground *)[cmdk-group-heading]{color:var(--muted-foreground)}:is(.\\*\\*\\:\\[\\[cmdk-list-sizer\\]\\]\\:relative *)[cmdk-list-sizer]{position:relative}:is(.\\*\\:\\[a\\]\\:underline>*):is(a){text-decoration-line:underline}:is(.\\*\\:\\[a\\]\\:underline-offset-3>*):is(a){text-underline-offset:3px}@media (hover:hover){:is(.\\*\\:\\[a\\]\\:hover\\:text-foreground>*):is(a):hover{color:var(--foreground)}}:is(.\\*\\:\\[img\\:first-child\\]\\:rounded-t-xl>*):is(img:first-child){border-top-left-radius:calc(var(--radius) + 4px);border-top-right-radius:calc(var(--radius) + 4px)}:is(.\\*\\:\\[img\\:last-child\\]\\:rounded-b-xl>*):is(img:last-child){border-bottom-right-radius:calc(var(--radius) + 4px);border-bottom-left-radius:calc(var(--radius) + 4px)}:is(.\\*\\:\\[span\\]\\:last\\:flex>*):is(span):last-child{display:flex}:is(.\\*\\:\\[span\\]\\:last\\:items-center>*):is(span):last-child{align-items:center}:is(.\\*\\:\\[span\\]\\:last\\:gap-2>*):is(span):last-child{gap:calc(var(--spacing) * 2)}:is(.\\*\\:\\[svg\\]\\:row-span-2>*):is(svg){grid-row:span 2/span 2}:is(.\\*\\:\\[svg\\]\\:translate-y-0\\.5>*):is(svg){--tw-translate-y:calc(var(--spacing) * .5);translate:var(--tw-translate-x) var(--tw-translate-y)}:is(.\\*\\:\\[svg\\]\\:text-current>*):is(svg){color:currentColor}:is(.\\*\\:\\[svg\\]\\:text-muted-foreground>*):is(svg){color:var(--muted-foreground)}:is(.data-selected\\:\\*\\:\\[svg\\]\\:text-foreground:where([data-selected=true])>*):is(svg){color:var(--foreground)}:is(.\\*\\:\\[svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-4>*):is(svg:not([class*=size-])){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}:is(.\\*\\:\\[svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-6>*):is(svg:not([class*=size-])){width:calc(var(--spacing) * 6);height:calc(var(--spacing) * 6)}.\\[\\&\\>\\[data-slot\\=dialog-close\\]\\]\\:top-2>[data-slot=dialog-close]{top:calc(var(--spacing) * 2)}.\\[\\&\\>\\[data-slot\\=dialog-close\\]\\]\\:right-2>[data-slot=dialog-close]{right:calc(var(--spacing) * 2)}.has-\\[\\>\\[data-align\\=block-end\\]\\]\\:\\[\\&\\>input\\]\\:pt-3:has(>[data-align=block-end])>input{padding-top:calc(var(--spacing) * 3)}.has-\\[\\>\\[data-align\\=block-start\\]\\]\\:\\[\\&\\>input\\]\\:pb-3:has(>[data-align=block-start])>input{padding-bottom:calc(var(--spacing) * 3)}.has-\\[\\>\\[data-align\\=inline-end\\]\\]\\:\\[\\&\\>input\\]\\:pr-1\\.5:has(>[data-align=inline-end])>input{padding-right:calc(var(--spacing) * 1.5)}.has-\\[\\>\\[data-align\\=inline-start\\]\\]\\:\\[\\&\\>input\\]\\:pl-1\\.5:has(>[data-align=inline-start])>input{padding-left:calc(var(--spacing) * 1.5)}.\\[\\&\\>kbd\\]\\:rounded-\\[calc\\(var\\(--radius\\)-5px\\)\\]>kbd{border-radius:calc(var(--radius) - 5px)}.\\[\\&\\>svg\\:first-child\\]\\:size-4>svg:first-child{width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.\\[\\&\\>svg\\:first-child\\]\\:shrink-0>svg:first-child{flex-shrink:0}.\\[\\&\\>svg\\:first-child\\]\\:text-muted-foreground>svg:first-child{color:var(--muted-foreground)}.\\[\\&\\>svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-3\\.5>svg:not([class*=size-]){width:calc(var(--spacing) * 3.5);height:calc(var(--spacing) * 3.5)}.\\[\\&\\>svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-4>svg:not([class*=size-]){width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}}@property --tw-animation-delay{syntax:\"*\";inherits:false;initial-value:0s}@property --tw-animation-direction{syntax:\"*\";inherits:false;initial-value:normal}@property --tw-animation-duration{syntax:\"*\";inherits:false}@property --tw-animation-fill-mode{syntax:\"*\";inherits:false;initial-value:none}@property --tw-animation-iteration-count{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-blur{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-opacity{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-rotate{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-scale{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-blur{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-opacity{syntax:\"*\";inherits:false;initial-value:1}@property --tw-exit-rotate{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-scale{syntax:\"*\";inherits:false;initial-value:1}@property --tw-exit-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --scroll-fade-t{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-b{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-s{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-e{syntax:\"<length-percentage>\";inherits:false;initial-value:0}@property --scroll-fade-mask{syntax:\"*\";inherits:false}@property --shimmer-angle{syntax:\"<angle>\";inherits:true;initial-value:20deg}@property --shimmer-image{syntax:\"*\";inherits:false}@property --shimmer-text-fill{syntax:\"*\";inherits:false}@media (prefers-reduced-motion:reduce){.shimmer{-webkit-text-fill-color:currentColor;background-image:none;animation:none}}:root,:host,.palette-scope{--background:oklch(100% 0 0);--foreground:oklch(14.5% 0 0);--card:oklch(100% 0 0);--card-foreground:oklch(14.5% 0 0);--popover:oklch(100% 0 0);--popover-foreground:oklch(14.5% 0 0);--primary:oklch(20.5% 0 0);--primary-foreground:oklch(98.5% 0 0);--secondary:oklch(97% 0 0);--secondary-foreground:oklch(20.5% 0 0);--muted:oklch(97% 0 0);--muted-foreground:oklch(55.6% 0 0);--accent:oklch(97% 0 0);--accent-foreground:oklch(20.5% 0 0);--destructive:oklch(57.7% .245 27.325);--warning:oklch(55.5% .163 48.998);--border:oklch(92.2% 0 0);--input:oklch(92.2% 0 0);--ring:oklch(70.8% 0 0);--chart-1:oklch(87% 0 0);--chart-2:oklch(55.6% 0 0);--chart-3:oklch(43.9% 0 0);--chart-4:oklch(37.1% 0 0);--chart-5:oklch(26.9% 0 0);--radius:.625rem;--sidebar:oklch(98.5% 0 0);--sidebar-foreground:oklch(14.5% 0 0);--sidebar-primary:oklch(20.5% 0 0);--sidebar-primary-foreground:oklch(98.5% 0 0);--sidebar-accent:oklch(97% 0 0);--sidebar-accent-foreground:oklch(20.5% 0 0);--sidebar-border:oklch(92.2% 0 0);--sidebar-ring:oklch(70.8% 0 0)}.dark,:host(.dark),.palette-scope.dark{--background:oklch(14.5% 0 0);--foreground:oklch(98.5% 0 0);--card:oklch(20.5% 0 0);--card-foreground:oklch(98.5% 0 0);--popover:oklch(20.5% 0 0);--popover-foreground:oklch(98.5% 0 0);--primary:oklch(92.2% 0 0);--primary-foreground:oklch(20.5% 0 0);--secondary:oklch(26.9% 0 0);--secondary-foreground:oklch(98.5% 0 0);--muted:oklch(26.9% 0 0);--muted-foreground:oklch(70.8% 0 0);--accent:oklch(26.9% 0 0);--accent-foreground:oklch(98.5% 0 0);--destructive:oklch(70.4% .191 22.216);--warning:oklch(82.8% .189 84.429);--border:oklch(100% 0 0/.1);--input:oklch(100% 0 0/.15);--ring:oklch(55.6% 0 0);--chart-1:oklch(87% 0 0);--chart-2:oklch(55.6% 0 0);--chart-3:oklch(43.9% 0 0);--chart-4:oklch(37.1% 0 0);--chart-5:oklch(26.9% 0 0);--sidebar:oklch(20.5% 0 0);--sidebar-foreground:oklch(98.5% 0 0);--sidebar-primary:oklch(48.8% .243 264.376);--sidebar-primary-foreground:oklch(98.5% 0 0);--sidebar-accent:oklch(26.9% 0 0);--sidebar-accent-foreground:oklch(98.5% 0 0);--sidebar-border:oklch(100% 0 0/.1);--sidebar-ring:oklch(55.6% 0 0)}:host{all:initial;--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark;font-family:var(--font-sans);font-synthesis:none;text-rendering:optimizelegibility}@media (prefers-color-scheme:dark){:host{--lightningcss-light: ;--lightningcss-dark:initial}}[data-slot=dialog-portal],[data-slot=dialog-overlay],[data-slot=dialog-content],[data-slot=switch-status]{color:var(--foreground);font-family:var(--font-sans);font-synthesis:none;pointer-events:auto;line-height:1.5}@keyframes s4e-progress-indeterminate{0%{transform:translate(-100%)}to{transform:translate(350%)}}[data-slot=progress-indeterminate]{animation:1.4s ease-in-out infinite s4e-progress-indeterminate}@media (prefers-reduced-motion:reduce){[data-slot=dialog-overlay],[data-slot=dialog-content],[data-slot=command].animate-surface-in,[data-slot=progress-indeterminate],.animate-check-in{animation:none!important}[data-slot=command-highlight],[data-slot=progress-indicator]{transition:none!important}}.no-scrollbar{scrollbar-width:none}.no-scrollbar::-webkit-scrollbar{display:none}.scroll-fade{--fade-depth:1.5rem}.scroll-fade[data-fade-mask=top]{-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%);mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black 100%)}.scroll-fade[data-fade-mask=bottom]{-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent);mask-image:linear-gradient(to bottom, black 0, black calc(100% - var(--fade-depth)), transparent)}.scroll-fade[data-fade-mask=both]{-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);-webkit-mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent);mask-image:linear-gradient(to bottom, transparent, black var(--fade-depth), black calc(100% - var(--fade-depth)), transparent)}@property --tw-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --tw-translate-z{syntax:\"*\";inherits:false;initial-value:0}@property --tw-scale-x{syntax:\"*\";inherits:false;initial-value:1}@property --tw-scale-y{syntax:\"*\";inherits:false;initial-value:1}@property --tw-scale-z{syntax:\"*\";inherits:false;initial-value:1}@property --tw-rotate-x{syntax:\"*\";inherits:false}@property --tw-rotate-y{syntax:\"*\";inherits:false}@property --tw-rotate-z{syntax:\"*\";inherits:false}@property --tw-skew-x{syntax:\"*\";inherits:false}@property --tw-skew-y{syntax:\"*\";inherits:false}@property --tw-pan-x{syntax:\"*\";inherits:false}@property --tw-pan-y{syntax:\"*\";inherits:false}@property --tw-pinch-zoom{syntax:\"*\";inherits:false}@property --tw-space-y-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-space-x-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-divide-x-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-border-style{syntax:\"*\";inherits:false;initial-value:solid}@property --tw-divide-y-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-leading{syntax:\"*\";inherits:false}@property --tw-font-weight{syntax:\"*\";inherits:false}@property --tw-tracking{syntax:\"*\";inherits:false}@property --tw-ordinal{syntax:\"*\";inherits:false}@property --tw-slashed-zero{syntax:\"*\";inherits:false}@property --tw-numeric-figure{syntax:\"*\";inherits:false}@property --tw-numeric-spacing{syntax:\"*\";inherits:false}@property --tw-numeric-fraction{syntax:\"*\";inherits:false}@property --tw-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:\"*\";inherits:false}@property --tw-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:\"*\";inherits:false}@property --tw-inset-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:\"*\";inherits:false}@property --tw-ring-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:\"*\";inherits:false}@property --tw-inset-ring-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:\"*\";inherits:false}@property --tw-ring-offset-width{syntax:\"<length>\";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:\"*\";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-outline-style{syntax:\"*\";inherits:false;initial-value:solid}@property --tw-blur{syntax:\"*\";inherits:false}@property --tw-brightness{syntax:\"*\";inherits:false}@property --tw-contrast{syntax:\"*\";inherits:false}@property --tw-grayscale{syntax:\"*\";inherits:false}@property --tw-hue-rotate{syntax:\"*\";inherits:false}@property --tw-invert{syntax:\"*\";inherits:false}@property --tw-opacity{syntax:\"*\";inherits:false}@property --tw-saturate{syntax:\"*\";inherits:false}@property --tw-sepia{syntax:\"*\";inherits:false}@property --tw-drop-shadow{syntax:\"*\";inherits:false}@property --tw-drop-shadow-color{syntax:\"*\";inherits:false}@property --tw-drop-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:\"*\";inherits:false}@property --tw-backdrop-blur{syntax:\"*\";inherits:false}@property --tw-backdrop-brightness{syntax:\"*\";inherits:false}@property --tw-backdrop-contrast{syntax:\"*\";inherits:false}@property --tw-backdrop-grayscale{syntax:\"*\";inherits:false}@property --tw-backdrop-hue-rotate{syntax:\"*\";inherits:false}@property --tw-backdrop-invert{syntax:\"*\";inherits:false}@property --tw-backdrop-opacity{syntax:\"*\";inherits:false}@property --tw-backdrop-saturate{syntax:\"*\";inherits:false}@property --tw-backdrop-sepia{syntax:\"*\";inherits:false}@property --tw-duration{syntax:\"*\";inherits:false}@property --tw-ease{syntax:\"*\";inherits:false}@property --tw-content{syntax:\"*\";inherits:false;initial-value:\"\"}@keyframes spin{to{transform:rotate(360deg)}}@keyframes enter{0%{opacity:var(--tw-enter-opacity,1);transform:translate3d(var(--tw-enter-translate-x,0),var(--tw-enter-translate-y,0),0)scale3d(var(--tw-enter-scale,1),var(--tw-enter-scale,1),var(--tw-enter-scale,1))rotate(var(--tw-enter-rotate,0));filter:blur(var(--tw-enter-blur,0))}}@keyframes exit{to{opacity:var(--tw-exit-opacity,1);transform:translate3d(var(--tw-exit-translate-x,0),var(--tw-exit-translate-y,0),0)scale3d(var(--tw-exit-scale,1),var(--tw-exit-scale,1),var(--tw-exit-scale,1))rotate(var(--tw-exit-rotate,0));filter:blur(var(--tw-exit-blur,0))}}@keyframes scroll-fade-reveal-t{0%{--scroll-fade-t:0px}to{--scroll-fade-t:var(--_scroll-fade-size-t,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))))}}@keyframes scroll-fade-reveal-b{0%{--scroll-fade-b:var(--_scroll-fade-size-b,var(--scroll-fade-size,min(12%, calc(var(--spacing) * 10))))}to{--scroll-fade-b:0px}}@keyframes tw-shimmer{0%{background-position:100% 0}to{background-position:0 0}}@keyframes s4e-dialog-in{0%{opacity:0;transform:translateY(.5rem)scale(.985)}}@keyframes s4e-dialog-out{to{opacity:0;transform:scale(.98)}}@keyframes s4e-overlay-in{0%{opacity:0}}@keyframes s4e-overlay-out{to{opacity:0}}@keyframes s4e-surface-in{0%{opacity:0;transform:translateY(6px)}}@keyframes s4e-screen-in{0%{opacity:0;transform:translateX(var(--surface-shift,.75rem))}}@keyframes s4e-check-in{0%{opacity:0;transform:scale(.6)}60%{opacity:1;transform:scale(1.08)}}", x = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), S = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), C = (e) => e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) => n ? n.toUpperCase() : t.toLowerCase()), w = (e) => {
	let t = C(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, T = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
}, ee = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
	return !1;
}, E = (0, _.createContext)({}), D = () => (0, _.useContext)(E), te = (0, _.forwardRef)(({ color: e, size: t, strokeWidth: n, absoluteStrokeWidth: r, className: i = "", children: a, iconNode: o, ...s }, c) => {
	let { size: l = 24, strokeWidth: u = 2, absoluteStrokeWidth: d = !1, color: f = "currentColor", className: p = "" } = D() ?? {}, m = r ?? d ? Number(n ?? u) * 24 / Number(t ?? l) : n ?? u;
	return (0, _.createElement)("svg", {
		ref: c,
		...T,
		width: t ?? l ?? T.width,
		height: t ?? l ?? T.height,
		stroke: e ?? f,
		strokeWidth: m,
		className: x("lucide", p, i),
		...!a && !ee(s) && { "aria-hidden": "true" },
		...s
	}, [...o.map(([e, t]) => (0, _.createElement)(e, t)), ...Array.isArray(a) ? a : [a]]);
}), O = (e, t) => {
	let n = (0, _.forwardRef)(({ className: n, ...r }, i) => (0, _.createElement)(te, {
		ref: i,
		iconNode: t,
		className: x(`lucide-${S(w(e))}`, `lucide-${e}`, n),
		...r
	}));
	return n.displayName = w(e), n;
}, ne = O("building-2", [
	["path", {
		d: "M10 12h4",
		key: "a56b0p"
	}],
	["path", {
		d: "M10 8h4",
		key: "1sr2af"
	}],
	["path", {
		d: "M14 21v-3a2 2 0 0 0-4 0v3",
		key: "1rgiei"
	}],
	["path", {
		d: "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",
		key: "secmi2"
	}],
	["path", {
		d: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",
		key: "16ra0t"
	}]
]), k = O("check", [["path", {
	d: "M20 6 9 17l-5-5",
	key: "1gmf2c"
}]]), re = O("chevron-left", [["path", {
	d: "m15 18-6-6 6-6",
	key: "1wnfg3"
}]]), ie = O("circle-alert", [
	["circle", {
		cx: "12",
		cy: "12",
		r: "10",
		key: "1mglay"
	}],
	["line", {
		x1: "12",
		x2: "12",
		y1: "8",
		y2: "12",
		key: "1pkeuh"
	}],
	["line", {
		x1: "12",
		x2: "12.01",
		y1: "16",
		y2: "16",
		key: "4dfq90"
	}]
]), ae = O("clock", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}], ["path", {
	d: "M12 6v6l4 2",
	key: "mmk7yg"
}]]), A = O("download", [
	["path", {
		d: "M12 15V3",
		key: "m9g1x1"
	}],
	["path", {
		d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
		key: "ih7n3h"
	}],
	["path", {
		d: "m7 10 5 5 5-5",
		key: "brsn70"
	}]
]), j = O("external-link", [
	["path", {
		d: "M15 3h6v6",
		key: "1q9fwt"
	}],
	["path", {
		d: "M10 14 21 3",
		key: "gplh6r"
	}],
	["path", {
		d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
		key: "a6xqqp"
	}]
]), oe = O("file-braces", [
	["path", {
		d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
		key: "1oefj6"
	}],
	["path", {
		d: "M14 2v5a1 1 0 0 0 1 1h5",
		key: "wfsgrz"
	}],
	["path", {
		d: "M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1",
		key: "1oajmo"
	}],
	["path", {
		d: "M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1",
		key: "mpwhp6"
	}]
]), se = O("file-spreadsheet", [
	["path", {
		d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
		key: "1oefj6"
	}],
	["path", {
		d: "M14 2v5a1 1 0 0 0 1 1h5",
		key: "wfsgrz"
	}],
	["path", {
		d: "M8 13h2",
		key: "yr2amv"
	}],
	["path", {
		d: "M14 13h2",
		key: "un5t4a"
	}],
	["path", {
		d: "M8 17h2",
		key: "2yhykz"
	}],
	["path", {
		d: "M14 17h2",
		key: "10kma7"
	}]
]), ce = O("file-text", [
	["path", {
		d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
		key: "1oefj6"
	}],
	["path", {
		d: "M14 2v5a1 1 0 0 0 1 1h5",
		key: "wfsgrz"
	}],
	["path", {
		d: "M10 9H8",
		key: "b1mrlr"
	}],
	["path", {
		d: "M16 13H8",
		key: "t4e002"
	}],
	["path", {
		d: "M16 17H8",
		key: "z1uh3a"
	}]
]), le = O("folder-open", [["path", {
	d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
	key: "usdka0"
}]]), M = O("loader-circle", [["path", {
	d: "M21 12a9 9 0 1 1-6.219-8.56",
	key: "13zald"
}]]), N = O("package-minus", [
	["path", {
		d: "M12 22V12",
		key: "d0xqtd"
	}],
	["path", {
		d: "M16 17h6",
		key: "1ook5g"
	}],
	["path", {
		d: "M21 13V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.675-.955",
		key: "zu9avd"
	}],
	["path", {
		d: "M3.29 7 12 12l8.71-5",
		key: "19ckod"
	}],
	["path", {
		d: "m7.5 4.27 8.997 5.148",
		key: "9yrvtv"
	}]
]), ue = O("package", [
	["path", {
		d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
		key: "1a0edw"
	}],
	["path", {
		d: "M12 22V12",
		key: "d0xqtd"
	}],
	["polyline", {
		points: "3.29 7 12 12 20.71 7",
		key: "ousv84"
	}],
	["path", {
		d: "m7.5 4.27 9 5.15",
		key: "1c824w"
	}]
]), P = O("search", [["path", {
	d: "m21 21-4.34-4.34",
	key: "14j7rj"
}], ["circle", {
	cx: "11",
	cy: "11",
	r: "8",
	key: "4ej97u"
}]]), de = O("settings", [["path", {
	d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
	key: "1i5ecw"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "3",
	key: "1v7zrd"
}]]), fe = O("triangle-alert", [
	["path", {
		d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
		key: "wmoenq"
	}],
	["path", {
		d: "M12 9v4",
		key: "juzpu7"
	}],
	["path", {
		d: "M12 17h.01",
		key: "p32p05"
	}]
]), pe = O("truck", [
	["path", {
		d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
		key: "wrbu53"
	}],
	["path", {
		d: "M15 18H9",
		key: "1lyqi6"
	}],
	["path", {
		d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
		key: "lysw3i"
	}],
	["circle", {
		cx: "17",
		cy: "18",
		r: "2",
		key: "332jqn"
	}],
	["circle", {
		cx: "7",
		cy: "18",
		r: "2",
		key: "19iecd"
	}]
]), me = O("x", [["path", {
	d: "M18 6 6 18",
	key: "1bl5f8"
}], ["path", {
	d: "m6 6 12 12",
	key: "d8bk6v"
}]]);
// node_modules/clsx/dist/clsx.mjs
function F(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = F(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function I() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = F(e)) && (r && (r += " "), r += t);
	return r;
}
// node_modules/class-variance-authority/dist/index.mjs
var L = (e) => typeof e == "boolean" ? `${e}` : e === 0 ? "0" : e, he = I, ge = (e, t) => (n) => {
	if (t?.variants == null) return he(e, n?.class, n?.className);
	let { variants: r, defaultVariants: i } = t, a = Object.keys(r).map((e) => {
		let t = n?.[e], a = i?.[e];
		if (t === null) return null;
		let o = L(t) || L(a);
		return r[e][o];
	}), o = n && Object.entries(n).reduce((e, t) => {
		let [n, r] = t;
		return r === void 0 || (e[n] = r), e;
	}, {});
	return he(e, a, t?.compoundVariants?.reduce((e, t) => {
		let { class: n, className: r, ...a } = t;
		return Object.entries(a).every((e) => {
			let [t, n] = e;
			return Array.isArray(n) ? n.includes({
				...i,
				...o
			}[t]) : {
				...i,
				...o
			}[t] === n;
		}) ? [
			...e,
			n,
			r
		] : e;
	}, []), n?.class, n?.className);
}, _e = (e, t) => {
	let n = Array(e.length + t.length);
	for (let t = 0; t < e.length; t++) n[t] = e[t];
	for (let r = 0; r < t.length; r++) n[e.length + r] = t[r];
	return n;
}, ve = (e, t) => ({
	classGroupId: e,
	validator: t
}), ye = (e = /* @__PURE__ */ new Map(), t = null, n) => ({
	nextPart: e,
	validators: t,
	classGroupId: n
}), be = "-", xe = [], Se = "arbitrary..", Ce = (e) => {
	let t = Ee(e), { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
	return {
		getClassGroupId: (e) => {
			if (e.startsWith("[") && e.endsWith("]")) return Te(e);
			let n = e.split(be);
			return we(n, +(n[0] === "" && n.length > 1), t);
		},
		getConflictingClassGroupIds: (e, t) => {
			if (t) {
				let t = r[e], i = n[e];
				return t ? i ? _e(i, t) : t : i || xe;
			}
			return n[e] || xe;
		}
	};
}, we = (e, t, n) => {
	if (e.length - t === 0) return n.classGroupId;
	let r = e[t], i = n.nextPart.get(r);
	if (i) {
		let n = we(e, t + 1, i);
		if (n) return n;
	}
	let a = n.validators;
	if (a === null) return;
	let o = t === 0 ? e.join(be) : e.slice(t).join(be), s = a.length;
	for (let e = 0; e < s; e++) {
		let t = a[e];
		if (t.validator(o)) return t.classGroupId;
	}
}, Te = (e) => e.slice(1, -1).indexOf(":") === -1 ? void 0 : (() => {
	let t = e.slice(1, -1), n = t.indexOf(":"), r = t.slice(0, n);
	return r ? Se + r : void 0;
})(), Ee = (e) => {
	let { theme: t, classGroups: n } = e;
	return De(n, t);
}, De = (e, t) => {
	let n = ye();
	for (let r in e) {
		let i = e[r];
		Oe(i, n, r, t);
	}
	return n;
}, Oe = (e, t, n, r) => {
	let i = e.length;
	for (let a = 0; a < i; a++) {
		let i = e[a];
		ke(i, t, n, r);
	}
}, ke = (e, t, n, r) => {
	typeof e == "string" ? Ae(e, t, n) : typeof e == "function" ? je(e, t, n, r) : Me(e, t, n, r);
}, Ae = (e, t, n) => {
	let r = e === "" ? t : Ne(t, e);
	r.classGroupId = n;
}, je = (e, t, n, r) => {
	Pe(e) ? Oe(e(r), t, n, r) : (t.validators === null && (t.validators = []), t.validators.push(ve(n, e)));
}, Me = (e, t, n, r) => {
	let i = Object.entries(e), a = i.length;
	for (let e = 0; e < a; e++) {
		let [a, o] = i[e];
		Oe(o, Ne(t, a), n, r);
	}
}, Ne = (e, t) => {
	let n = e, r = t.split(be), i = r.length;
	for (let e = 0; e < i; e++) {
		let t = r[e], i = n.nextPart.get(t);
		i || (i = ye(), n.nextPart.set(t, i)), n = i;
	}
	return n;
}, Pe = (e) => "isThemeGetter" in e && e.isThemeGetter === !0, Fe = (e) => {
	if (e < 1) return {
		get: () => void 0,
		set: () => {}
	};
	let t = 0, n = Object.create(null), r = Object.create(null), i = (i, a) => {
		n[i] = a, t++, t > e && (t = 0, r = n, n = Object.create(null));
	};
	return {
		get(e) {
			let t = n[e];
			if (t !== void 0) return t;
			if ((t = r[e]) !== void 0) return i(e, t), t;
		},
		set(e, t) {
			e in n ? n[e] = t : i(e, t);
		}
	};
}, Ie = "!", Le = ":", Re = [], ze = (e, t, n, r, i) => ({
	modifiers: e,
	hasImportantModifier: t,
	baseClassName: n,
	maybePostfixModifierPosition: r,
	isExternal: i
}), Be = (e) => {
	let { prefix: t, experimentalParseClassName: n } = e, r = (e) => {
		let t = [], n = 0, r = 0, i = 0, a, o = e.length;
		for (let s = 0; s < o; s++) {
			let o = e[s];
			if (n === 0 && r === 0) {
				if (o === Le) {
					t.push(e.slice(i, s)), i = s + 1;
					continue;
				}
				if (o === "/") {
					a = s;
					continue;
				}
			}
			o === "[" ? n++ : o === "]" ? n-- : o === "(" ? r++ : o === ")" && r--;
		}
		let s = t.length === 0 ? e : e.slice(i), c = s, l = !1;
		s.endsWith(Ie) ? (c = s.slice(0, -1), l = !0) : s.startsWith(Ie) && (c = s.slice(1), l = !0);
		let u = a && a > i ? a - i : void 0;
		return ze(t, l, c, u);
	};
	if (t) {
		let e = t + Le, n = r;
		r = (t) => t.startsWith(e) ? n(t.slice(e.length)) : ze(Re, !1, t, void 0, !0);
	}
	if (n) {
		let e = r;
		r = (t) => n({
			className: t,
			parseClassName: e
		});
	}
	return r;
}, Ve = (e) => {
	let t = /* @__PURE__ */ new Map();
	return e.orderSensitiveModifiers.forEach((e, n) => {
		t.set(e, 1e6 + n);
	}), (e) => {
		let n = [], r = [];
		for (let i = 0; i < e.length; i++) {
			let a = e[i], o = a[0] === "[", s = t.has(a);
			o || s ? (r.length > 0 && (r.sort(), n.push(...r), r = []), n.push(a)) : r.push(a);
		}
		return r.length > 0 && (r.sort(), n.push(...r)), n;
	};
}, He = (e) => ({
	cache: Fe(e.cacheSize),
	parseClassName: Be(e),
	sortModifiers: Ve(e),
	postfixLookupClassGroupIds: Ue(e),
	...Ce(e)
}), Ue = (e) => {
	let t = Object.create(null), n = e.postfixLookupClassGroups;
	if (n) for (let e = 0; e < n.length; e++) t[n[e]] = !0;
	return t;
}, We = /\s+/, Ge = (e, t) => {
	let { parseClassName: n, getClassGroupId: r, getConflictingClassGroupIds: i, sortModifiers: a, postfixLookupClassGroupIds: o } = t, s = [], c = e.trim().split(We), l = "";
	for (let e = c.length - 1; e >= 0; --e) {
		let t = c[e], { isExternal: u, modifiers: d, hasImportantModifier: f, baseClassName: p, maybePostfixModifierPosition: m } = n(t);
		if (u) {
			l = t + (l.length > 0 ? " " + l : l);
			continue;
		}
		let h = !!m, g;
		if (h) {
			g = r(p.substring(0, m));
			let e = g && o[g] ? r(p) : void 0;
			e && e !== g && (g = e, h = !1);
		} else g = r(p);
		if (!g) {
			if (!h || (g = r(p), !g)) {
				l = t + (l.length > 0 ? " " + l : l);
				continue;
			}
			h = !1;
		}
		let _ = d.length === 0 ? "" : d.length === 1 ? d[0] : a(d).join(":"), v = f ? _ + Ie : _, y = v + g;
		if (s.indexOf(y) > -1) continue;
		s.push(y);
		let b = i(g, h);
		for (let e = 0; e < b.length; ++e) {
			let t = b[e];
			s.push(v + t);
		}
		l = t + (l.length > 0 ? " " + l : l);
	}
	return l;
}, Ke = (...e) => {
	let t = 0, n, r, i = "";
	for (; t < e.length;) (n = e[t++]) && (r = qe(n)) && (i && (i += " "), i += r);
	return i;
}, qe = (e) => {
	if (typeof e == "string") return e;
	let t, n = "";
	for (let r = 0; r < e.length; r++) e[r] && (t = qe(e[r])) && (n && (n += " "), n += t);
	return n;
}, Je = (e, ...t) => {
	let n, r, i, a, o = (o) => (n = He(t.reduce((e, t) => t(e), e())), r = n.cache.get, i = n.cache.set, a = s, s(o)), s = (e) => {
		let t = r(e);
		if (t) return t;
		let a = Ge(e, n);
		return i(e, a), a;
	};
	return a = o, (...e) => a(Ke(...e));
}, Ye = [], Xe = (e) => {
	let t = (t) => t[e] || Ye;
	return t.isThemeGetter = !0, t;
}, Ze = /^\[(?:(\w[\w-]*):)?(.+)\]$/i, Qe = /^\((?:(\w[\w-]*):)?(.+)\)$/i, $e = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/, et = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, tt = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, nt = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/, rt = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, it = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, at = (e) => $e.test(e), R = (e) => !!e && !Number.isNaN(Number(e)), ot = (e) => !!e && Number.isInteger(Number(e)), st = (e) => e.endsWith("%") && R(e.slice(0, -1)), ct = (e) => et.test(e), lt = () => !0, ut = (e) => tt.test(e) && !nt.test(e), dt = () => !1, ft = (e) => rt.test(e), pt = (e) => it.test(e), mt = (e) => !z(e) && !B(e), ht = (e) => e.startsWith("@container") && (e[10] === "/" && e[11] !== void 0 || e[11] === "s" && e[16] !== void 0 && e.startsWith("-size/", 10) || e[11] === "n" && e[18] !== void 0 && e.startsWith("-normal/", 10)), gt = (e) => jt(e, Ft, dt), z = (e) => Ze.test(e), _t = (e) => jt(e, It, ut), vt = (e) => jt(e, Lt, R), yt = (e) => jt(e, zt, lt), bt = (e) => jt(e, Rt, dt), xt = (e) => jt(e, Nt, dt), St = (e) => jt(e, Pt, pt), Ct = (e) => jt(e, Bt, ft), B = (e) => Qe.test(e), wt = (e) => Mt(e, It), Tt = (e) => Mt(e, Rt), Et = (e) => Mt(e, Nt), Dt = (e) => Mt(e, Ft), Ot = (e) => Mt(e, Pt), kt = (e) => Mt(e, Bt, !0), At = (e) => Mt(e, zt, !0), jt = (e, t, n) => {
	let r = Ze.exec(e);
	return r ? r[1] ? t(r[1]) : n(r[2]) : !1;
}, Mt = (e, t, n = !1) => {
	let r = Qe.exec(e);
	return r ? r[1] ? t(r[1]) : n : !1;
}, Nt = (e) => e === "position" || e === "percentage", Pt = (e) => e === "image" || e === "url", Ft = (e) => e === "length" || e === "size" || e === "bg-size", It = (e) => e === "length", Lt = (e) => e === "number", Rt = (e) => e === "family-name", zt = (e) => e === "number" || e === "weight", Bt = (e) => e === "shadow", Vt = /*#__PURE__*/ Je(() => {
	let e = Xe("color"), t = Xe("font"), n = Xe("text"), r = Xe("font-weight"), i = Xe("tracking"), a = Xe("leading"), o = Xe("breakpoint"), s = Xe("container"), c = Xe("spacing"), l = Xe("radius"), u = Xe("shadow"), d = Xe("inset-shadow"), f = Xe("text-shadow"), p = Xe("drop-shadow"), m = Xe("blur"), h = Xe("perspective"), g = Xe("aspect"), _ = Xe("ease"), v = Xe("animate"), y = () => [
		"auto",
		"avoid",
		"all",
		"avoid-page",
		"page",
		"left",
		"right",
		"column"
	], b = () => [
		"center",
		"top",
		"bottom",
		"left",
		"right",
		"top-left",
		"left-top",
		"top-right",
		"right-top",
		"bottom-right",
		"right-bottom",
		"bottom-left",
		"left-bottom"
	], x = () => [
		...b(),
		B,
		z
	], S = () => [
		"auto",
		"hidden",
		"clip",
		"visible",
		"scroll"
	], C = () => [
		"auto",
		"contain",
		"none"
	], w = () => [
		B,
		z,
		c
	], T = () => [
		at,
		"full",
		"auto",
		...w()
	], ee = () => [
		ot,
		"none",
		"subgrid",
		B,
		z
	], E = () => [
		"auto",
		{ span: [
			"full",
			ot,
			B,
			z
		] },
		ot,
		B,
		z
	], D = () => [
		ot,
		"auto",
		B,
		z
	], te = () => [
		"auto",
		"min",
		"max",
		"fr",
		B,
		z
	], O = () => [
		"start",
		"end",
		"center",
		"between",
		"around",
		"evenly",
		"stretch",
		"baseline",
		"center-safe",
		"end-safe"
	], ne = () => [
		"start",
		"end",
		"center",
		"stretch",
		"center-safe",
		"end-safe"
	], k = () => ["auto", ...w()], re = () => [
		at,
		"auto",
		"full",
		"dvw",
		"dvh",
		"lvw",
		"lvh",
		"svw",
		"svh",
		"min",
		"max",
		"fit",
		...w()
	], ie = () => [
		at,
		"screen",
		"full",
		"dvw",
		"lvw",
		"svw",
		"min",
		"max",
		"fit",
		...w()
	], ae = () => [
		at,
		"screen",
		"full",
		"lh",
		"dvh",
		"lvh",
		"svh",
		"min",
		"max",
		"fit",
		...w()
	], A = () => [
		e,
		B,
		z
	], j = () => [
		...b(),
		Et,
		xt,
		{ position: [B, z] }
	], oe = () => ["no-repeat", { repeat: [
		"",
		"x",
		"y",
		"space",
		"round"
	] }], se = () => [
		"auto",
		"cover",
		"contain",
		Dt,
		gt,
		{ size: [B, z] }
	], ce = () => [
		st,
		wt,
		_t
	], le = () => [
		"",
		"none",
		"full",
		l,
		B,
		z
	], M = () => [
		"",
		R,
		wt,
		_t
	], N = () => [
		"solid",
		"dashed",
		"dotted",
		"double"
	], ue = () => [
		"normal",
		"multiply",
		"screen",
		"overlay",
		"darken",
		"lighten",
		"color-dodge",
		"color-burn",
		"hard-light",
		"soft-light",
		"difference",
		"exclusion",
		"hue",
		"saturation",
		"color",
		"luminosity"
	], P = () => [
		R,
		st,
		Et,
		xt
	], de = () => [
		"",
		"none",
		m,
		B,
		z
	], fe = () => [
		"none",
		R,
		B,
		z
	], pe = () => [
		"none",
		R,
		B,
		z
	], me = () => [
		R,
		B,
		z
	], F = () => [
		at,
		"full",
		...w()
	];
	return {
		cacheSize: 500,
		theme: {
			animate: [
				"spin",
				"ping",
				"pulse",
				"bounce"
			],
			aspect: ["video"],
			blur: [ct],
			breakpoint: [ct],
			color: [lt],
			container: [ct],
			"drop-shadow": [ct],
			ease: [
				"in",
				"out",
				"in-out"
			],
			font: [mt],
			"font-weight": [
				"thin",
				"extralight",
				"light",
				"normal",
				"medium",
				"semibold",
				"bold",
				"extrabold",
				"black"
			],
			"inset-shadow": [ct],
			leading: [
				"none",
				"tight",
				"snug",
				"normal",
				"relaxed",
				"loose"
			],
			perspective: [
				"dramatic",
				"near",
				"normal",
				"midrange",
				"distant",
				"none"
			],
			radius: [ct],
			shadow: [ct],
			spacing: ["px", R],
			text: [ct],
			"text-shadow": [ct],
			tracking: [
				"tighter",
				"tight",
				"normal",
				"wide",
				"wider",
				"widest"
			]
		},
		classGroups: {
			aspect: [{ aspect: [
				"auto",
				"square",
				at,
				z,
				B,
				g
			] }],
			container: ["container"],
			"container-type": [{ "@container": [
				"",
				"normal",
				"size",
				B,
				z
			] }],
			"container-named": [ht],
			columns: [{ columns: [
				R,
				z,
				B,
				s
			] }],
			"break-after": [{ "break-after": y() }],
			"break-before": [{ "break-before": y() }],
			"break-inside": [{ "break-inside": [
				"auto",
				"avoid",
				"avoid-page",
				"avoid-column"
			] }],
			"box-decoration": [{ "box-decoration": ["slice", "clone"] }],
			box: [{ box: ["border", "content"] }],
			display: [
				"block",
				"inline-block",
				"inline",
				"flex",
				"inline-flex",
				"table",
				"inline-table",
				"table-caption",
				"table-cell",
				"table-column",
				"table-column-group",
				"table-footer-group",
				"table-header-group",
				"table-row-group",
				"table-row",
				"flow-root",
				"grid",
				"inline-grid",
				"contents",
				"list-item",
				"hidden"
			],
			sr: ["sr-only", "not-sr-only"],
			float: [{ float: [
				"right",
				"left",
				"none",
				"start",
				"end"
			] }],
			clear: [{ clear: [
				"left",
				"right",
				"both",
				"none",
				"start",
				"end"
			] }],
			isolation: ["isolate", "isolation-auto"],
			"object-fit": [{ object: [
				"contain",
				"cover",
				"fill",
				"none",
				"scale-down"
			] }],
			"object-position": [{ object: x() }],
			overflow: [{ overflow: S() }],
			"overflow-x": [{ "overflow-x": S() }],
			"overflow-y": [{ "overflow-y": S() }],
			overscroll: [{ overscroll: C() }],
			"overscroll-x": [{ "overscroll-x": C() }],
			"overscroll-y": [{ "overscroll-y": C() }],
			position: [
				"static",
				"fixed",
				"absolute",
				"relative",
				"sticky"
			],
			inset: [{ inset: T() }],
			"inset-x": [{ "inset-x": T() }],
			"inset-y": [{ "inset-y": T() }],
			start: [{
				"inset-s": T(),
				start: T()
			}],
			end: [{
				"inset-e": T(),
				end: T()
			}],
			"inset-bs": [{ "inset-bs": T() }],
			"inset-be": [{ "inset-be": T() }],
			top: [{ top: T() }],
			right: [{ right: T() }],
			bottom: [{ bottom: T() }],
			left: [{ left: T() }],
			visibility: [
				"visible",
				"invisible",
				"collapse"
			],
			z: [{ z: [
				ot,
				"auto",
				B,
				z
			] }],
			basis: [{ basis: [
				at,
				"full",
				"auto",
				s,
				...w()
			] }],
			"flex-direction": [{ flex: [
				"row",
				"row-reverse",
				"col",
				"col-reverse"
			] }],
			"flex-wrap": [{ flex: [
				"nowrap",
				"wrap",
				"wrap-reverse"
			] }],
			flex: [{ flex: [
				R,
				at,
				"auto",
				"initial",
				"none",
				z
			] }],
			grow: [{ grow: [
				"",
				R,
				B,
				z
			] }],
			shrink: [{ shrink: [
				"",
				R,
				B,
				z
			] }],
			order: [{ order: [
				ot,
				"first",
				"last",
				"none",
				B,
				z
			] }],
			"grid-cols": [{ "grid-cols": ee() }],
			"col-start-end": [{ col: E() }],
			"col-start": [{ "col-start": D() }],
			"col-end": [{ "col-end": D() }],
			"grid-rows": [{ "grid-rows": ee() }],
			"row-start-end": [{ row: E() }],
			"row-start": [{ "row-start": D() }],
			"row-end": [{ "row-end": D() }],
			"grid-flow": [{ "grid-flow": [
				"row",
				"col",
				"dense",
				"row-dense",
				"col-dense"
			] }],
			"auto-cols": [{ "auto-cols": te() }],
			"auto-rows": [{ "auto-rows": te() }],
			gap: [{ gap: w() }],
			"gap-x": [{ "gap-x": w() }],
			"gap-y": [{ "gap-y": w() }],
			"justify-content": [{ justify: [...O(), "normal"] }],
			"justify-items": [{ "justify-items": [...ne(), "normal"] }],
			"justify-self": [{ "justify-self": ["auto", ...ne()] }],
			"align-content": [{ content: ["normal", ...O()] }],
			"align-items": [{ items: [...ne(), { baseline: ["", "last"] }] }],
			"align-self": [{ self: [
				"auto",
				...ne(),
				{ baseline: ["", "last"] }
			] }],
			"place-content": [{ "place-content": O() }],
			"place-items": [{ "place-items": [...ne(), "baseline"] }],
			"place-self": [{ "place-self": ["auto", ...ne()] }],
			p: [{ p: w() }],
			px: [{ px: w() }],
			py: [{ py: w() }],
			ps: [{ ps: w() }],
			pe: [{ pe: w() }],
			pbs: [{ pbs: w() }],
			pbe: [{ pbe: w() }],
			pt: [{ pt: w() }],
			pr: [{ pr: w() }],
			pb: [{ pb: w() }],
			pl: [{ pl: w() }],
			m: [{ m: k() }],
			mx: [{ mx: k() }],
			my: [{ my: k() }],
			ms: [{ ms: k() }],
			me: [{ me: k() }],
			mbs: [{ mbs: k() }],
			mbe: [{ mbe: k() }],
			mt: [{ mt: k() }],
			mr: [{ mr: k() }],
			mb: [{ mb: k() }],
			ml: [{ ml: k() }],
			"space-x": [{ "space-x": w() }],
			"space-x-reverse": ["space-x-reverse"],
			"space-y": [{ "space-y": w() }],
			"space-y-reverse": ["space-y-reverse"],
			size: [{ size: re() }],
			"inline-size": [{ inline: ["auto", ...ie()] }],
			"min-inline-size": [{ "min-inline": ["auto", ...ie()] }],
			"max-inline-size": [{ "max-inline": ["none", ...ie()] }],
			"block-size": [{ block: ["auto", ...ae()] }],
			"min-block-size": [{ "min-block": ["auto", ...ae()] }],
			"max-block-size": [{ "max-block": ["none", ...ae()] }],
			w: [{ w: [
				s,
				"screen",
				...re()
			] }],
			"min-w": [{ "min-w": [
				s,
				"screen",
				"none",
				...re()
			] }],
			"max-w": [{ "max-w": [
				s,
				"screen",
				"none",
				"prose",
				{ screen: [o] },
				...re()
			] }],
			h: [{ h: [
				"screen",
				"lh",
				...re()
			] }],
			"min-h": [{ "min-h": [
				"screen",
				"lh",
				"none",
				...re()
			] }],
			"max-h": [{ "max-h": [
				"screen",
				"lh",
				...re()
			] }],
			"font-size": [{ text: [
				"base",
				n,
				wt,
				_t
			] }],
			"font-smoothing": ["antialiased", "subpixel-antialiased"],
			"font-style": ["italic", "not-italic"],
			"font-weight": [{ font: [
				r,
				At,
				yt
			] }],
			"font-stretch": [{ "font-stretch": [
				"ultra-condensed",
				"extra-condensed",
				"condensed",
				"semi-condensed",
				"normal",
				"semi-expanded",
				"expanded",
				"extra-expanded",
				"ultra-expanded",
				st,
				z
			] }],
			"font-family": [{ font: [
				Tt,
				bt,
				t
			] }],
			"font-features": [{ "font-features": [z] }],
			"fvn-normal": ["normal-nums"],
			"fvn-ordinal": ["ordinal"],
			"fvn-slashed-zero": ["slashed-zero"],
			"fvn-figure": ["lining-nums", "oldstyle-nums"],
			"fvn-spacing": ["proportional-nums", "tabular-nums"],
			"fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
			tracking: [{ tracking: [
				i,
				B,
				z
			] }],
			"line-clamp": [{ "line-clamp": [
				R,
				"none",
				B,
				vt
			] }],
			leading: [{ leading: [a, ...w()] }],
			"list-image": [{ "list-image": [
				"none",
				B,
				z
			] }],
			"list-style-position": [{ list: ["inside", "outside"] }],
			"list-style-type": [{ list: [
				"disc",
				"decimal",
				"none",
				B,
				z
			] }],
			"text-alignment": [{ text: [
				"left",
				"center",
				"right",
				"justify",
				"start",
				"end"
			] }],
			"placeholder-color": [{ placeholder: A() }],
			"text-color": [{ text: A() }],
			"text-decoration": [
				"underline",
				"overline",
				"line-through",
				"no-underline"
			],
			"text-decoration-style": [{ decoration: [...N(), "wavy"] }],
			"text-decoration-thickness": [{ decoration: [
				R,
				"from-font",
				"auto",
				B,
				_t
			] }],
			"text-decoration-color": [{ decoration: A() }],
			"underline-offset": [{ "underline-offset": [
				R,
				"auto",
				B,
				z
			] }],
			"text-transform": [
				"uppercase",
				"lowercase",
				"capitalize",
				"normal-case"
			],
			"text-overflow": [
				"truncate",
				"text-ellipsis",
				"text-clip"
			],
			"text-wrap": [{ text: [
				"wrap",
				"nowrap",
				"balance",
				"pretty"
			] }],
			indent: [{ indent: w() }],
			"tab-size": [{ tab: [
				ot,
				B,
				z
			] }],
			"vertical-align": [{ align: [
				"baseline",
				"top",
				"middle",
				"bottom",
				"text-top",
				"text-bottom",
				"sub",
				"super",
				B,
				z
			] }],
			whitespace: [{ whitespace: [
				"normal",
				"nowrap",
				"pre",
				"pre-line",
				"pre-wrap",
				"break-spaces"
			] }],
			break: [{ break: [
				"normal",
				"words",
				"all",
				"keep"
			] }],
			wrap: [{ wrap: [
				"break-word",
				"anywhere",
				"normal"
			] }],
			hyphens: [{ hyphens: [
				"none",
				"manual",
				"auto"
			] }],
			content: [{ content: [
				"none",
				B,
				z
			] }],
			"bg-attachment": [{ bg: [
				"fixed",
				"local",
				"scroll"
			] }],
			"bg-clip": [{ "bg-clip": [
				"border",
				"padding",
				"content",
				"text"
			] }],
			"bg-origin": [{ "bg-origin": [
				"border",
				"padding",
				"content"
			] }],
			"bg-position": [{ bg: j() }],
			"bg-repeat": [{ bg: oe() }],
			"bg-size": [{ bg: se() }],
			"bg-image": [{ bg: [
				"none",
				{
					linear: [
						{ to: [
							"t",
							"tr",
							"r",
							"br",
							"b",
							"bl",
							"l",
							"tl"
						] },
						ot,
						B,
						z
					],
					radial: [
						"",
						B,
						z
					],
					conic: [
						ot,
						B,
						z
					]
				},
				Ot,
				St
			] }],
			"bg-color": [{ bg: A() }],
			"gradient-from-pos": [{ from: ce() }],
			"gradient-via-pos": [{ via: ce() }],
			"gradient-to-pos": [{ to: ce() }],
			"gradient-from": [{ from: A() }],
			"gradient-via": [{ via: A() }],
			"gradient-to": [{ to: A() }],
			rounded: [{ rounded: le() }],
			"rounded-s": [{ "rounded-s": le() }],
			"rounded-e": [{ "rounded-e": le() }],
			"rounded-t": [{ "rounded-t": le() }],
			"rounded-r": [{ "rounded-r": le() }],
			"rounded-b": [{ "rounded-b": le() }],
			"rounded-l": [{ "rounded-l": le() }],
			"rounded-ss": [{ "rounded-ss": le() }],
			"rounded-se": [{ "rounded-se": le() }],
			"rounded-ee": [{ "rounded-ee": le() }],
			"rounded-es": [{ "rounded-es": le() }],
			"rounded-tl": [{ "rounded-tl": le() }],
			"rounded-tr": [{ "rounded-tr": le() }],
			"rounded-br": [{ "rounded-br": le() }],
			"rounded-bl": [{ "rounded-bl": le() }],
			"border-w": [{ border: M() }],
			"border-w-x": [{ "border-x": M() }],
			"border-w-y": [{ "border-y": M() }],
			"border-w-s": [{ "border-s": M() }],
			"border-w-e": [{ "border-e": M() }],
			"border-w-bs": [{ "border-bs": M() }],
			"border-w-be": [{ "border-be": M() }],
			"border-w-t": [{ "border-t": M() }],
			"border-w-r": [{ "border-r": M() }],
			"border-w-b": [{ "border-b": M() }],
			"border-w-l": [{ "border-l": M() }],
			"divide-x": [{ "divide-x": M() }],
			"divide-x-reverse": ["divide-x-reverse"],
			"divide-y": [{ "divide-y": M() }],
			"divide-y-reverse": ["divide-y-reverse"],
			"border-style": [{ border: [
				...N(),
				"hidden",
				"none"
			] }],
			"divide-style": [{ divide: [
				...N(),
				"hidden",
				"none"
			] }],
			"border-color": [{ border: A() }],
			"border-color-x": [{ "border-x": A() }],
			"border-color-y": [{ "border-y": A() }],
			"border-color-s": [{ "border-s": A() }],
			"border-color-e": [{ "border-e": A() }],
			"border-color-bs": [{ "border-bs": A() }],
			"border-color-be": [{ "border-be": A() }],
			"border-color-t": [{ "border-t": A() }],
			"border-color-r": [{ "border-r": A() }],
			"border-color-b": [{ "border-b": A() }],
			"border-color-l": [{ "border-l": A() }],
			"divide-color": [{ divide: A() }],
			"outline-style": [{ outline: [
				...N(),
				"none",
				"hidden"
			] }],
			"outline-offset": [{ "outline-offset": [
				R,
				B,
				z
			] }],
			"outline-w": [{ outline: [
				"",
				R,
				wt,
				_t
			] }],
			"outline-color": [{ outline: A() }],
			shadow: [{ shadow: [
				"",
				"none",
				u,
				kt,
				Ct
			] }],
			"shadow-color": [{ shadow: A() }],
			"inset-shadow": [{ "inset-shadow": [
				"none",
				d,
				kt,
				Ct
			] }],
			"inset-shadow-color": [{ "inset-shadow": A() }],
			"ring-w": [{ ring: M() }],
			"ring-w-inset": ["ring-inset"],
			"ring-color": [{ ring: A() }],
			"ring-offset-w": [{ "ring-offset": [R, _t] }],
			"ring-offset-color": [{ "ring-offset": A() }],
			"inset-ring-w": [{ "inset-ring": M() }],
			"inset-ring-color": [{ "inset-ring": A() }],
			"text-shadow": [{ "text-shadow": [
				"none",
				f,
				kt,
				Ct
			] }],
			"text-shadow-color": [{ "text-shadow": A() }],
			opacity: [{ opacity: [
				R,
				B,
				z
			] }],
			"mix-blend": [{ "mix-blend": [
				...ue(),
				"plus-darker",
				"plus-lighter"
			] }],
			"bg-blend": [{ "bg-blend": ue() }],
			"mask-clip": [{ "mask-clip": [
				"border",
				"padding",
				"content",
				"fill",
				"stroke",
				"view"
			] }, "mask-no-clip"],
			"mask-composite": [{ mask: [
				"add",
				"subtract",
				"intersect",
				"exclude"
			] }],
			"mask-image-linear-pos": [{ "mask-linear": [R] }],
			"mask-image-linear-from-pos": [{ "mask-linear-from": P() }],
			"mask-image-linear-to-pos": [{ "mask-linear-to": P() }],
			"mask-image-linear-from-color": [{ "mask-linear-from": A() }],
			"mask-image-linear-to-color": [{ "mask-linear-to": A() }],
			"mask-image-t-from-pos": [{ "mask-t-from": P() }],
			"mask-image-t-to-pos": [{ "mask-t-to": P() }],
			"mask-image-t-from-color": [{ "mask-t-from": A() }],
			"mask-image-t-to-color": [{ "mask-t-to": A() }],
			"mask-image-r-from-pos": [{ "mask-r-from": P() }],
			"mask-image-r-to-pos": [{ "mask-r-to": P() }],
			"mask-image-r-from-color": [{ "mask-r-from": A() }],
			"mask-image-r-to-color": [{ "mask-r-to": A() }],
			"mask-image-b-from-pos": [{ "mask-b-from": P() }],
			"mask-image-b-to-pos": [{ "mask-b-to": P() }],
			"mask-image-b-from-color": [{ "mask-b-from": A() }],
			"mask-image-b-to-color": [{ "mask-b-to": A() }],
			"mask-image-l-from-pos": [{ "mask-l-from": P() }],
			"mask-image-l-to-pos": [{ "mask-l-to": P() }],
			"mask-image-l-from-color": [{ "mask-l-from": A() }],
			"mask-image-l-to-color": [{ "mask-l-to": A() }],
			"mask-image-x-from-pos": [{ "mask-x-from": P() }],
			"mask-image-x-to-pos": [{ "mask-x-to": P() }],
			"mask-image-x-from-color": [{ "mask-x-from": A() }],
			"mask-image-x-to-color": [{ "mask-x-to": A() }],
			"mask-image-y-from-pos": [{ "mask-y-from": P() }],
			"mask-image-y-to-pos": [{ "mask-y-to": P() }],
			"mask-image-y-from-color": [{ "mask-y-from": A() }],
			"mask-image-y-to-color": [{ "mask-y-to": A() }],
			"mask-image-radial": [{ "mask-radial": [B, z] }],
			"mask-image-radial-from-pos": [{ "mask-radial-from": P() }],
			"mask-image-radial-to-pos": [{ "mask-radial-to": P() }],
			"mask-image-radial-from-color": [{ "mask-radial-from": A() }],
			"mask-image-radial-to-color": [{ "mask-radial-to": A() }],
			"mask-image-radial-shape": [{ "mask-radial": ["circle", "ellipse"] }],
			"mask-image-radial-size": [{ "mask-radial": [{
				closest: ["side", "corner"],
				farthest: ["side", "corner"]
			}] }],
			"mask-image-radial-pos": [{ "mask-radial-at": b() }],
			"mask-image-conic-pos": [{ "mask-conic": [R] }],
			"mask-image-conic-from-pos": [{ "mask-conic-from": P() }],
			"mask-image-conic-to-pos": [{ "mask-conic-to": P() }],
			"mask-image-conic-from-color": [{ "mask-conic-from": A() }],
			"mask-image-conic-to-color": [{ "mask-conic-to": A() }],
			"mask-mode": [{ mask: [
				"alpha",
				"luminance",
				"match"
			] }],
			"mask-origin": [{ "mask-origin": [
				"border",
				"padding",
				"content",
				"fill",
				"stroke",
				"view"
			] }],
			"mask-position": [{ mask: j() }],
			"mask-repeat": [{ mask: oe() }],
			"mask-size": [{ mask: se() }],
			"mask-type": [{ "mask-type": ["alpha", "luminance"] }],
			"mask-image": [{ mask: [
				"none",
				B,
				z
			] }],
			filter: [{ filter: [
				"",
				"none",
				B,
				z
			] }],
			blur: [{ blur: de() }],
			brightness: [{ brightness: [
				R,
				B,
				z
			] }],
			contrast: [{ contrast: [
				R,
				B,
				z
			] }],
			"drop-shadow": [{ "drop-shadow": [
				"",
				"none",
				p,
				kt,
				Ct
			] }],
			"drop-shadow-color": [{ "drop-shadow": A() }],
			grayscale: [{ grayscale: [
				"",
				R,
				B,
				z
			] }],
			"hue-rotate": [{ "hue-rotate": [
				R,
				B,
				z
			] }],
			invert: [{ invert: [
				"",
				R,
				B,
				z
			] }],
			saturate: [{ saturate: [
				R,
				B,
				z
			] }],
			sepia: [{ sepia: [
				"",
				R,
				B,
				z
			] }],
			"backdrop-filter": [{ "backdrop-filter": [
				"",
				"none",
				B,
				z
			] }],
			"backdrop-blur": [{ "backdrop-blur": de() }],
			"backdrop-brightness": [{ "backdrop-brightness": [
				R,
				B,
				z
			] }],
			"backdrop-contrast": [{ "backdrop-contrast": [
				R,
				B,
				z
			] }],
			"backdrop-grayscale": [{ "backdrop-grayscale": [
				"",
				R,
				B,
				z
			] }],
			"backdrop-hue-rotate": [{ "backdrop-hue-rotate": [
				R,
				B,
				z
			] }],
			"backdrop-invert": [{ "backdrop-invert": [
				"",
				R,
				B,
				z
			] }],
			"backdrop-opacity": [{ "backdrop-opacity": [
				R,
				B,
				z
			] }],
			"backdrop-saturate": [{ "backdrop-saturate": [
				R,
				B,
				z
			] }],
			"backdrop-sepia": [{ "backdrop-sepia": [
				"",
				R,
				B,
				z
			] }],
			"border-collapse": [{ border: ["collapse", "separate"] }],
			"border-spacing": [{ "border-spacing": w() }],
			"border-spacing-x": [{ "border-spacing-x": w() }],
			"border-spacing-y": [{ "border-spacing-y": w() }],
			"table-layout": [{ table: ["auto", "fixed"] }],
			caption: [{ caption: ["top", "bottom"] }],
			transition: [{ transition: [
				"",
				"all",
				"colors",
				"opacity",
				"shadow",
				"transform",
				"none",
				B,
				z
			] }],
			"transition-behavior": [{ transition: ["normal", "discrete"] }],
			duration: [{ duration: [
				R,
				"initial",
				B,
				z
			] }],
			ease: [{ ease: [
				"linear",
				"initial",
				_,
				B,
				z
			] }],
			delay: [{ delay: [
				R,
				B,
				z
			] }],
			animate: [{ animate: [
				"none",
				v,
				B,
				z
			] }],
			backface: [{ backface: ["hidden", "visible"] }],
			perspective: [{ perspective: [
				h,
				B,
				z
			] }],
			"perspective-origin": [{ "perspective-origin": x() }],
			rotate: [{ rotate: fe() }],
			"rotate-x": [{ "rotate-x": fe() }],
			"rotate-y": [{ "rotate-y": fe() }],
			"rotate-z": [{ "rotate-z": fe() }],
			scale: [{ scale: pe() }],
			"scale-x": [{ "scale-x": pe() }],
			"scale-y": [{ "scale-y": pe() }],
			"scale-z": [{ "scale-z": pe() }],
			"scale-3d": ["scale-3d"],
			skew: [{ skew: me() }],
			"skew-x": [{ "skew-x": me() }],
			"skew-y": [{ "skew-y": me() }],
			transform: [{ transform: [
				B,
				z,
				"",
				"none",
				"gpu",
				"cpu"
			] }],
			"transform-origin": [{ origin: x() }],
			"transform-style": [{ transform: ["3d", "flat"] }],
			translate: [{ translate: F() }],
			"translate-x": [{ "translate-x": F() }],
			"translate-y": [{ "translate-y": F() }],
			"translate-z": [{ "translate-z": F() }],
			"translate-none": ["translate-none"],
			zoom: [{ zoom: [
				ot,
				B,
				z
			] }],
			accent: [{ accent: A() }],
			appearance: [{ appearance: ["none", "auto"] }],
			"caret-color": [{ caret: A() }],
			"color-scheme": [{ scheme: [
				"normal",
				"dark",
				"light",
				"light-dark",
				"only-dark",
				"only-light"
			] }],
			cursor: [{ cursor: [
				"auto",
				"default",
				"pointer",
				"wait",
				"text",
				"move",
				"help",
				"not-allowed",
				"none",
				"context-menu",
				"progress",
				"cell",
				"crosshair",
				"vertical-text",
				"alias",
				"copy",
				"no-drop",
				"grab",
				"grabbing",
				"all-scroll",
				"col-resize",
				"row-resize",
				"n-resize",
				"e-resize",
				"s-resize",
				"w-resize",
				"ne-resize",
				"nw-resize",
				"se-resize",
				"sw-resize",
				"ew-resize",
				"ns-resize",
				"nesw-resize",
				"nwse-resize",
				"zoom-in",
				"zoom-out",
				B,
				z
			] }],
			"field-sizing": [{ "field-sizing": ["fixed", "content"] }],
			"pointer-events": [{ "pointer-events": ["auto", "none"] }],
			resize: [{ resize: [
				"none",
				"",
				"y",
				"x"
			] }],
			"scroll-behavior": [{ scroll: ["auto", "smooth"] }],
			"scrollbar-thumb-color": [{ "scrollbar-thumb": A() }],
			"scrollbar-track-color": [{ "scrollbar-track": A() }],
			"scrollbar-gutter": [{ "scrollbar-gutter": [
				"auto",
				"stable",
				"both"
			] }],
			"scrollbar-w": [{ scrollbar: [
				"auto",
				"thin",
				"none"
			] }],
			"scroll-m": [{ "scroll-m": w() }],
			"scroll-mx": [{ "scroll-mx": w() }],
			"scroll-my": [{ "scroll-my": w() }],
			"scroll-ms": [{ "scroll-ms": w() }],
			"scroll-me": [{ "scroll-me": w() }],
			"scroll-mbs": [{ "scroll-mbs": w() }],
			"scroll-mbe": [{ "scroll-mbe": w() }],
			"scroll-mt": [{ "scroll-mt": w() }],
			"scroll-mr": [{ "scroll-mr": w() }],
			"scroll-mb": [{ "scroll-mb": w() }],
			"scroll-ml": [{ "scroll-ml": w() }],
			"scroll-p": [{ "scroll-p": w() }],
			"scroll-px": [{ "scroll-px": w() }],
			"scroll-py": [{ "scroll-py": w() }],
			"scroll-ps": [{ "scroll-ps": w() }],
			"scroll-pe": [{ "scroll-pe": w() }],
			"scroll-pbs": [{ "scroll-pbs": w() }],
			"scroll-pbe": [{ "scroll-pbe": w() }],
			"scroll-pt": [{ "scroll-pt": w() }],
			"scroll-pr": [{ "scroll-pr": w() }],
			"scroll-pb": [{ "scroll-pb": w() }],
			"scroll-pl": [{ "scroll-pl": w() }],
			"snap-align": [{ snap: [
				"start",
				"end",
				"center",
				"align-none"
			] }],
			"snap-stop": [{ snap: ["normal", "always"] }],
			"snap-type": [{ snap: [
				"none",
				"x",
				"y",
				"both"
			] }],
			"snap-strictness": [{ snap: ["mandatory", "proximity"] }],
			touch: [{ touch: [
				"auto",
				"none",
				"manipulation"
			] }],
			"touch-x": [{ "touch-pan": [
				"x",
				"left",
				"right"
			] }],
			"touch-y": [{ "touch-pan": [
				"y",
				"up",
				"down"
			] }],
			"touch-pz": ["touch-pinch-zoom"],
			select: [{ select: [
				"none",
				"text",
				"all",
				"auto"
			] }],
			"will-change": [{ "will-change": [
				"auto",
				"scroll",
				"contents",
				"transform",
				B,
				z
			] }],
			fill: [{ fill: ["none", ...A()] }],
			"stroke-w": [{ stroke: [
				R,
				wt,
				_t,
				vt
			] }],
			stroke: [{ stroke: ["none", ...A()] }],
			"forced-color-adjust": [{ "forced-color-adjust": ["auto", "none"] }]
		},
		conflictingClassGroups: {
			"container-named": ["container-type"],
			overflow: ["overflow-x", "overflow-y"],
			overscroll: ["overscroll-x", "overscroll-y"],
			inset: [
				"inset-x",
				"inset-y",
				"inset-bs",
				"inset-be",
				"start",
				"end",
				"top",
				"right",
				"bottom",
				"left"
			],
			"inset-x": ["right", "left"],
			"inset-y": ["top", "bottom"],
			flex: [
				"basis",
				"grow",
				"shrink"
			],
			gap: ["gap-x", "gap-y"],
			p: [
				"px",
				"py",
				"ps",
				"pe",
				"pbs",
				"pbe",
				"pt",
				"pr",
				"pb",
				"pl"
			],
			px: ["pr", "pl"],
			py: ["pt", "pb"],
			m: [
				"mx",
				"my",
				"ms",
				"me",
				"mbs",
				"mbe",
				"mt",
				"mr",
				"mb",
				"ml"
			],
			mx: ["mr", "ml"],
			my: ["mt", "mb"],
			size: ["w", "h"],
			"font-size": ["leading"],
			"fvn-normal": [
				"fvn-ordinal",
				"fvn-slashed-zero",
				"fvn-figure",
				"fvn-spacing",
				"fvn-fraction"
			],
			"fvn-ordinal": ["fvn-normal"],
			"fvn-slashed-zero": ["fvn-normal"],
			"fvn-figure": ["fvn-normal"],
			"fvn-spacing": ["fvn-normal"],
			"fvn-fraction": ["fvn-normal"],
			"line-clamp": ["display", "overflow"],
			rounded: [
				"rounded-s",
				"rounded-e",
				"rounded-t",
				"rounded-r",
				"rounded-b",
				"rounded-l",
				"rounded-ss",
				"rounded-se",
				"rounded-ee",
				"rounded-es",
				"rounded-tl",
				"rounded-tr",
				"rounded-br",
				"rounded-bl"
			],
			"rounded-s": ["rounded-ss", "rounded-es"],
			"rounded-e": ["rounded-se", "rounded-ee"],
			"rounded-t": ["rounded-tl", "rounded-tr"],
			"rounded-r": ["rounded-tr", "rounded-br"],
			"rounded-b": ["rounded-br", "rounded-bl"],
			"rounded-l": ["rounded-tl", "rounded-bl"],
			"border-spacing": ["border-spacing-x", "border-spacing-y"],
			"border-w": [
				"border-w-x",
				"border-w-y",
				"border-w-s",
				"border-w-e",
				"border-w-bs",
				"border-w-be",
				"border-w-t",
				"border-w-r",
				"border-w-b",
				"border-w-l"
			],
			"border-w-x": ["border-w-r", "border-w-l"],
			"border-w-y": ["border-w-t", "border-w-b"],
			"border-color": [
				"border-color-x",
				"border-color-y",
				"border-color-s",
				"border-color-e",
				"border-color-bs",
				"border-color-be",
				"border-color-t",
				"border-color-r",
				"border-color-b",
				"border-color-l"
			],
			"border-color-x": ["border-color-r", "border-color-l"],
			"border-color-y": ["border-color-t", "border-color-b"],
			translate: [
				"translate-x",
				"translate-y",
				"translate-none"
			],
			"translate-none": [
				"translate",
				"translate-x",
				"translate-y",
				"translate-z"
			],
			"scroll-m": [
				"scroll-mx",
				"scroll-my",
				"scroll-ms",
				"scroll-me",
				"scroll-mbs",
				"scroll-mbe",
				"scroll-mt",
				"scroll-mr",
				"scroll-mb",
				"scroll-ml"
			],
			"scroll-mx": ["scroll-mr", "scroll-ml"],
			"scroll-my": ["scroll-mt", "scroll-mb"],
			"scroll-p": [
				"scroll-px",
				"scroll-py",
				"scroll-ps",
				"scroll-pe",
				"scroll-pbs",
				"scroll-pbe",
				"scroll-pt",
				"scroll-pr",
				"scroll-pb",
				"scroll-pl"
			],
			"scroll-px": ["scroll-pr", "scroll-pl"],
			"scroll-py": ["scroll-pt", "scroll-pb"],
			touch: [
				"touch-x",
				"touch-y",
				"touch-pz"
			],
			"touch-x": ["touch"],
			"touch-y": ["touch"],
			"touch-pz": ["touch"]
		},
		conflictingClassGroupModifiers: { "font-size": ["leading"] },
		postfixLookupClassGroups: ["container-type"],
		orderSensitiveModifiers: [
			"*",
			"**",
			"after",
			"backdrop",
			"before",
			"details-content",
			"file",
			"first-letter",
			"first-line",
			"marker",
			"placeholder",
			"selection"
		]
	};
});
// src/lib/utils.ts
function V(...e) {
	return Vt(I(e));
}
// node_modules/react/cjs/react-jsx-runtime.production.js
var Ht = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), H = (/* @__PURE__ */ o(((e, t) => {
	t.exports = Ht();
})))(), Ut = ge("group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4", {
	variants: { variant: {
		default: "bg-card text-card-foreground",
		destructive: "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current"
	} },
	defaultVariants: { variant: "default" }
});
function Wt({ className: e, variant: t, ...n }) {
	return /* @__PURE__ */ (0, H.jsx)("div", {
		"data-slot": "alert",
		role: "alert",
		className: V(Ut({ variant: t }), e),
		...n
	});
}
function Gt({ className: e, ...t }) {
	return /* @__PURE__ */ (0, H.jsx)("div", {
		"data-slot": "alert-description",
		className: V("text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4", e),
		...t
	});
}
// node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var Kt = Object.defineProperty, qt = (e, t) => Kt(e, "name", {
	value: t,
	configurable: !0
});
function Jt(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
qt(Jt, "setRef");
function Yt(...e) {
	return (t) => {
		let n = !1, r = e.map((e) => {
			let r = Jt(e, t);
			return !n && typeof r == "function" && (n = !0), r;
		});
		if (n) return () => {
			for (let t = 0; t < r.length; t++) {
				let n = r[t];
				typeof n == "function" ? n() : Jt(e[t], null);
			}
		};
	};
}
qt(Yt, "composeRefs");
function Xt(...e) {
	return _.useCallback(Yt(...e), e);
}
qt(Xt, "useComposedRefs");
// node_modules/@radix-ui/react-slot/dist/index.mjs
var Zt = Object.defineProperty, Qt = (e, t) => Zt(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function $t(e) {
	let t = _.forwardRef((t, n) => {
		let { children: r, ...i } = t, a = null, o = !1, s = [];
		ln(r) && typeof pn == "function" && (r = pn(r._payload)), _.Children.forEach(r, (e) => {
			if (sn(e)) {
				o = !0;
				let t = e, n = "child" in t.props ? t.props.child : t.props.children;
				ln(n) && typeof pn == "function" && (n = pn(n._payload)), a = rn(t, n), s.push(a?.props?.children);
			} else s.push(e);
		}), a ? a = _.cloneElement(a, void 0, s) : !o && _.Children.count(r) === 1 && _.isValidElement(r) && (a = r);
		let c = a ? on(a) : void 0, l = Xt(n, c);
		if (!a) {
			if (r || r === 0) throw Error(o ? fn(e) : dn(e));
			return r;
		}
		let u = an(i, a.props ?? {});
		return a.type !== _.Fragment && (u.ref = n ? l : c), _.cloneElement(a, u);
	});
	return t.displayName = `${e}.Slot`, t;
}
Qt($t, "createSlot");
var en = /* @__PURE__ */ $t("Slot"), tn = Symbol.for("radix.slottable");
// @__NO_SIDE_EFFECTS__
function nn(e) {
	let t = /* @__PURE__ */ Qt((e) => "child" in e ? e.children(e.child) : e.children, "Slottable");
	return t.displayName = `${e}.Slottable`, t.__radixId = tn, t;
}
Qt(nn, "createSlottable");
var rn = /* @__PURE__ */ Qt((e, t) => {
	if ("child" in e.props) {
		let t = e.props.child;
		return _.isValidElement(t) ? _.cloneElement(t, void 0, e.props.children(t.props.children)) : null;
	}
	return _.isValidElement(t) ? t : null;
}, "getSlottableElementFromSlottable");
function an(e, t) {
	let n = { ...t };
	for (let r in t) {
		let i = e[r], a = t[r];
		/^on[A-Z]/.test(r) ? i && a ? n[r] = (...e) => {
			let t = a(...e);
			return i(...e), t;
		} : i && (n[r] = i) : r === "style" ? n[r] = {
			...i,
			...a
		} : r === "className" && (n[r] = [i, a].filter(Boolean).join(" "));
	}
	return {
		...e,
		...n
	};
}
Qt(an, "mergeProps");
function on(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
Qt(on, "getElementRef");
function sn(e) {
	return _.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === tn;
}
Qt(sn, "isSlottable");
var cn = Symbol.for("react.lazy");
function ln(e) {
	return typeof e == "object" && !!e && "$$typeof" in e && e.$$typeof === cn && "_payload" in e && un(e._payload);
}
Qt(ln, "isLazyComponent");
function un(e) {
	return typeof e == "object" && !!e && "then" in e;
}
Qt(un, "isPromiseLike");
var dn = /* @__PURE__ */ Qt((e) => `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`, "createSlotError"), fn = /* @__PURE__ */ Qt((e) => `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`, "createSlottableError"), pn = _.use, mn = Object.defineProperty, hn = (e, t) => mn(e, "name", {
	value: t,
	configurable: !0
}), gn = [
	"a",
	"button",
	"div",
	"form",
	"h2",
	"h3",
	"img",
	"input",
	"label",
	"li",
	"nav",
	"ol",
	"p",
	"select",
	"span",
	"svg",
	"ul"
].reduce((e, t) => {
	let n = /* @__PURE__ */ $t(`Primitive.${t}`), r = _.forwardRef((e, r) => {
		let { asChild: i, ...a } = e, o = i ? n : t;
		return typeof window < "u" && (window[Symbol.for("radix-ui")] = !0), /* @__PURE__ */ (0, H.jsx)(o, {
			...a,
			ref: r
		});
	});
	return r.displayName = `Primitive.${t}`, {
		...e,
		[t]: r
	};
}, {});
function _n(e, t) {
	e && v.flushSync(() => e.dispatchEvent(t));
}
hn(_n, "dispatchDiscreteCustomEvent");
// node_modules/@radix-ui/react-context/dist/index.mjs
var vn = Object.defineProperty, yn = (e, t) => vn(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function bn(e, t) {
	let n = _.createContext(t);
	n.displayName = e + "Context";
	let r = /* @__PURE__ */ yn((e) => {
		let { children: t, ...r } = e, i = _.useMemo(() => r, Object.values(r));
		return /* @__PURE__ */ (0, H.jsx)(n.Provider, {
			value: i,
			children: t
		});
	}, "Provider");
	r.displayName = e + "Provider";
	function i(r, i = {}) {
		let { optional: a = !1 } = i, o = _.useContext(n);
		if (o) return o;
		if (t !== void 0) return t;
		if (!a) throw Error(`\`${r}\` must be used within \`${e}\``);
	}
	return yn(i, "useContext"), [r, i];
}
yn(bn, "createContext");
// @__NO_SIDE_EFFECTS__
function xn(e, t = []) {
	let n = [];
	function r(t, r) {
		let i = _.createContext(r);
		i.displayName = t + "Context";
		let a = n.length;
		n = [...n, r];
		let o = /* @__PURE__ */ yn((t) => {
			let { scope: n, children: r, ...o } = t, s = n?.[e]?.[a] || i, c = _.useMemo(() => o, Object.values(o));
			return /* @__PURE__ */ (0, H.jsx)(s.Provider, {
				value: c,
				children: r
			});
		}, "Provider");
		o.displayName = t + "Provider";
		function s(n, o, s = {}) {
			let { optional: c = !1 } = s, l = o?.[e]?.[a] || i, u = _.useContext(l);
			if (u) return u;
			if (r !== void 0) return r;
			if (!c) throw Error(`\`${n}\` must be used within \`${t}\``);
		}
		return yn(s, "useContext"), [o, s];
	}
	yn(r, "createContext");
	let i = /* @__PURE__ */ yn(() => {
		let t = n.map((e) => _.createContext(e));
		return /* @__PURE__ */ yn(function(n) {
			let r = n?.[e] || t;
			return _.useMemo(() => ({ [`__scope${e}`]: {
				...n,
				[e]: r
			} }), [n, r]);
		}, "useScope");
	}, "createScope");
	return i.scopeName = e, [r, Sn(i, ...t)];
}
yn(xn, "createContextScope");
function Sn(...e) {
	let t = e[0];
	if (e.length === 1) return t;
	let n = /* @__PURE__ */ yn(() => {
		let n = e.map((e) => ({
			useScope: e(),
			scopeName: e.scopeName
		}));
		return /* @__PURE__ */ yn(function(e) {
			let r = n.reduce((t, { useScope: n, scopeName: r }) => {
				let i = n(e)[`__scope${r}`];
				return {
					...t,
					...i
				};
			}, {});
			return _.useMemo(() => ({ [`__scope${t.scopeName}`]: r }), [r]);
		}, "useComposedScopes");
	}, "createScope");
	return n.scopeName = t.scopeName, n;
}
yn(Sn, "composeContextScopes");
// node_modules/@radix-ui/primitive/dist/index.mjs
var Cn = Object.defineProperty, wn = (e, t) => Cn(e, "name", {
	value: t,
	configurable: !0
}), Tn = !!(typeof window < "u" && window.document && window.document.createElement);
function En(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
	return /* @__PURE__ */ wn(function(r) {
		if (e?.(r), n === !1 || !r || !r.defaultPrevented) return t?.(r);
	}, "handleEvent");
}
wn(En, "composeEventHandlers");
function Dn(e) {
	if (!Tn) throw Error("Cannot access window outside of the DOM");
	return e?.ownerDocument?.defaultView ?? window;
}
wn(Dn, "getOwnerWindow");
function On(e) {
	if (!Tn) throw Error("Cannot access document outside of the DOM");
	return e?.ownerDocument ?? document;
}
wn(On, "getOwnerDocument");
function kn(e, t = !1) {
	let { activeElement: n } = On(e);
	if (!n?.nodeName) return null;
	if (An(n) && n.contentDocument) return kn(n.contentDocument.body, t);
	if (t) {
		let e = n.getAttribute("aria-activedescendant");
		if (e) {
			let t = On(n).getElementById(e);
			if (t) return t;
		}
	}
	return n;
}
wn(kn, "getActiveElement");
function An(e) {
	return e.tagName === "IFRAME";
}
wn(An, "isFrame");
// node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
var jn = globalThis?.document ? _.useLayoutEffect : () => {}, Mn = Object.defineProperty, Nn = (e, t) => Mn(e, "name", {
	value: t,
	configurable: !0
}), Pn = _.useEffectEvent, Fn = _.useInsertionEffect;
function In(e) {
	if (typeof Pn == "function") return Pn(e);
	let t = _.useRef(() => {
		throw Error("Cannot call an event handler while rendering.");
	});
	return typeof Fn == "function" ? Fn(() => {
		t.current = e;
	}) : jn(() => {
		t.current = e;
	}), _.useMemo(() => ((...e) => t.current?.(...e)), []);
}
Nn(In, "useEffectEvent");
// node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
var Ln = Object.defineProperty, Rn = (e, t) => Ln(e, "name", {
	value: t,
	configurable: !0
}), zn = _.useInsertionEffect || jn;
function Bn({ prop: e, defaultProp: t, onChange: n = /* @__PURE__ */ Rn(() => {}, "onChange"), caller: r }) {
	let [i, a, o] = Vn({
		defaultProp: t,
		onChange: n
	}), s = e !== void 0;
	return [s ? e : i, _.useCallback((t) => {
		if (s) {
			let n = Hn(t) ? t(e) : t;
			n !== e && o.current?.(n);
		} else a(t);
	}, [
		s,
		e,
		a,
		o
	])];
}
Rn(Bn, "useControllableState");
function Vn({ defaultProp: e, onChange: t }) {
	let [n, r] = _.useState(e), i = _.useRef(n), a = _.useRef(t);
	return zn(() => {
		a.current = t;
	}, [t]), _.useEffect(() => {
		i.current !== n && (a.current?.(n), i.current = n);
	}, [n, i]), [
		n,
		r,
		a
	];
}
Rn(Vn, "useUncontrolledState");
function Hn(e) {
	return typeof e == "function";
}
Rn(Hn, "isFunction");
var Un = Symbol("RADIX:SYNC_STATE");
function Wn(e, t, n, r) {
	let { prop: i, defaultProp: a, onChange: o, caller: s } = t, c = i !== void 0, l = In(o), u = [{
		...n,
		state: a
	}];
	r && u.push(r);
	let [d, f] = _.useReducer((t, n) => {
		if (n.type === Un) return {
			...t,
			state: n.state
		};
		let r = e(t, n);
		return c && !Object.is(r.state, t.state) && l(r.state), r;
	}, ...u), p = d.state, m = _.useRef(p);
	_.useEffect(() => {
		m.current !== p && (m.current = p, c || l(p));
	}, [
		p,
		m,
		c
	]);
	let h = _.useMemo(() => i === void 0 ? d : {
		...d,
		state: i
	}, [d, i]);
	return _.useEffect(() => {
		c && !Object.is(i, d.state) && f({
			type: Un,
			state: i
		});
	}, [
		i,
		d.state,
		c
	]), [h, f];
}
Rn(Wn, "useControllableStateReducer");
// node_modules/@radix-ui/react-presence/dist/index.mjs
var Gn = Object.defineProperty, Kn = (e, t) => Gn(e, "name", {
	value: t,
	configurable: !0
});
function qn(e, t) {
	return _.useReducer((e, n) => t[e][n] ?? e, e);
}
Kn(qn, "useStateMachine");
var Jn = /* @__PURE__ */ Kn((e) => {
	let { present: t, children: n } = e, r = Yn(t), i = typeof n == "function" ? n({ present: r.isPresent }) : _.Children.only(n), a = Zn(r.ref, $n(i));
	return typeof n == "function" || r.isPresent ? _.cloneElement(i, { ref: a }) : null;
}, "Presence");
function Yn(e) {
	let [t, n] = _.useState(), r = _.useRef(null), i = _.useRef(e), a = _.useRef("none"), o = _.useRef(void 0), [s, c] = qn(e ? "mounted" : "unmounted", {
		mounted: {
			UNMOUNT: "unmounted",
			ANIMATION_OUT: "unmountSuspended"
		},
		unmountSuspended: {
			MOUNT: "mounted",
			ANIMATION_END: "unmounted"
		},
		unmounted: { MOUNT: "mounted" }
	});
	return _.useEffect(() => {
		s === "mounted" ? (a.current = o.current ?? Qn(r.current), o.current = void 0) : a.current = "none";
	}, [s]), jn(() => {
		let t = r.current, n = i.current;
		if (n !== e) {
			let r = a.current, s = Qn(t);
			e ? (o.current = s, c("MOUNT")) : s === "none" || t?.display === "none" ? c("UNMOUNT") : c(n && r !== s ? "ANIMATION_OUT" : "UNMOUNT"), i.current = e;
		}
	}, [e, c]), jn(() => {
		if (t) {
			let e, n = t.ownerDocument.defaultView ?? window, o = /* @__PURE__ */ Kn((a) => {
				let o = Qn(r.current).includes(CSS.escape(a.animationName));
				if (a.target === t && o && (c("ANIMATION_END"), !i.current)) {
					let r = t.style.animationFillMode;
					t.style.animationFillMode = "forwards", e = n.setTimeout(() => {
						t.style.animationFillMode === "forwards" && (t.style.animationFillMode = r);
					});
				}
			}, "handleAnimationEnd"), s = /* @__PURE__ */ Kn((e) => {
				e.target === t && (a.current = Qn(r.current));
			}, "handleAnimationStart");
			return t.addEventListener("animationstart", s), t.addEventListener("animationcancel", o), t.addEventListener("animationend", o), () => {
				n.clearTimeout(e), t.removeEventListener("animationstart", s), t.removeEventListener("animationcancel", o), t.removeEventListener("animationend", o);
			};
		}
		c("ANIMATION_END");
	}, [t, c]), {
		isPresent: ["mounted", "unmountSuspended"].includes(s),
		ref: _.useCallback((e) => {
			if (e) {
				let t = getComputedStyle(e);
				r.current = t, o.current = Qn(t);
			} else r.current = null;
			n(e);
		}, [])
	};
}
Kn(Yn, "usePresence");
function Xn(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
Kn(Xn, "setRef");
function Zn(...e) {
	let t = _.useRef(e);
	return t.current = e, _.useCallback((e) => {
		let n = t.current, r = !1, i = n.map((t) => {
			let n = Xn(t, e);
			return !r && typeof n == "function" && (r = !0), n;
		});
		if (r) return () => {
			for (let e = 0; e < i.length; e++) {
				let t = i[e];
				typeof t == "function" ? t() : Xn(n[e], null);
			}
		};
	}, []);
}
Kn(Zn, "useStableComposedRefs");
function Qn(e) {
	return e?.animationName || "none";
}
Kn(Qn, "getAnimationName");
function $n(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
Kn($n, "getElementRef");
// node_modules/@radix-ui/react-id/dist/index.mjs
var er = Object.defineProperty, tr = (e, t) => er(e, "name", {
	value: t,
	configurable: !0
}), nr = _.useId || (() => void 0), rr = 0;
function ir(e) {
	let [t, n] = _.useState(nr());
	return jn(() => {
		e || n((e) => e ?? String(rr++));
	}, [e]), e || (t ? `radix-${t}` : "");
}
tr(ir, "useId");
// node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
var ar = Object.defineProperty, or = (e, t) => ar(e, "name", {
	value: t,
	configurable: !0
});
function sr(e) {
	let t = _.useRef(e);
	return _.useEffect(() => {
		t.current = e;
	}), _.useMemo(() => ((...e) => t.current?.(...e)), []);
}
or(sr, "useCallbackRef");
// node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs
var cr = Object.defineProperty, lr = (e, t) => cr(e, "name", {
	value: t,
	configurable: !0
}), ur = "dismissableLayer.update", dr = "dismissableLayer.pointerDownOutside", fr = "dismissableLayer.focusOutside", pr, mr = _.createContext({
	layers: /* @__PURE__ */ new Set(),
	layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
	branches: /* @__PURE__ */ new Set(),
	dismissableSurfaces: /* @__PURE__ */ new Set()
}), hr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ lr(function(e, t) {
	let { disableOutsidePointerEvents: n = !1, deferPointerDownOutside: r = !1, onEscapeKeyDown: i, onPointerDownOutside: a, onFocusOutside: o, onInteractOutside: s, onDismiss: c, ...l } = e, u = _.useContext(mr), [d, f] = _.useState(null), p = d?.ownerDocument ?? globalThis?.document, [, m] = _.useState({}), h = Xt(t, f), g = Array.from(u.layers), [v] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1), y = v ? g.indexOf(v) : -1, b = d ? g.indexOf(d) : -1, x = u.layersWithOutsidePointerEventsDisabled.size > 0, S = b >= y, C = _.useRef(!1), w = vr((e) => {
		a?.(e), s?.(e), e.defaultPrevented || c?.();
	}, {
		ownerDocument: p,
		deferPointerDownOutside: r,
		isDeferredPointerDownOutsideRef: C,
		dismissableSurfaces: u.dismissableSurfaces,
		shouldHandlePointerDownOutside: _.useCallback((e) => {
			if (!(e instanceof Node)) return !1;
			let t = [...u.branches].some((t) => t.contains(e));
			return S && !t;
		}, [u.branches, S])
	}), T = yr((e) => {
		if (r && C.current) return;
		let t = e.target;
		[...u.branches].some((e) => e.contains(t)) || (o?.(e), s?.(e), e.defaultPrevented || c?.());
	}, p), ee = d ? b === g.length - 1 : !1, E = sr((e) => {
		e.key === "Escape" && (i?.(e), !e.defaultPrevented && c && (e.preventDefault(), c()));
	});
	return _.useEffect(() => {
		if (ee) return p.addEventListener("keydown", E, { capture: !0 }), () => p.removeEventListener("keydown", E, { capture: !0 });
	}, [
		p,
		ee,
		E
	]), _.useEffect(() => {
		if (d) return n && (u.layersWithOutsidePointerEventsDisabled.size === 0 && (pr = p.body.style.pointerEvents, p.body.style.pointerEvents = "none"), u.layersWithOutsidePointerEventsDisabled.add(d)), u.layers.add(d), br(), () => {
			n && (u.layersWithOutsidePointerEventsDisabled.delete(d), u.layersWithOutsidePointerEventsDisabled.size === 0 && (p.body.style.pointerEvents = pr));
		};
	}, [
		d,
		p,
		n,
		u
	]), _.useEffect(() => () => {
		d && (u.layers.delete(d), u.layersWithOutsidePointerEventsDisabled.delete(d), br());
	}, [d, u]), _.useEffect(() => {
		let e = /* @__PURE__ */ lr(() => m({}), "handleUpdate");
		return document.addEventListener(ur, e), () => document.removeEventListener(ur, e);
	}, []), /* @__PURE__ */ (0, H.jsx)(gn.div, {
		...l,
		ref: h,
		style: {
			pointerEvents: x ? S ? "auto" : "none" : void 0,
			...e.style
		},
		onFocusCapture: En(e.onFocusCapture, T.onFocusCapture),
		onBlurCapture: En(e.onBlurCapture, T.onBlurCapture),
		onPointerDownCapture: En(e.onPointerDownCapture, w.onPointerDownCapture)
	});
}, "DismissableLayer"));
function gr() {
	let e = _.useContext(mr), [t, n] = _.useState(null);
	return _.useEffect(() => {
		if (t) return e.dismissableSurfaces.add(t), () => {
			e.dismissableSurfaces.delete(t);
		};
	}, [t, e.dismissableSurfaces]), n;
}
lr(gr, "useDismissableLayerSurface");
var _r = /* @__PURE__ */ lr(() => !0, "IS_TRUE");
function vr(e, t) {
	let { ownerDocument: n = globalThis?.document, deferPointerDownOutside: r = !1, isDeferredPointerDownOutsideRef: i, dismissableSurfaces: a, shouldHandlePointerDownOutside: o = _r } = t, s = sr(e), c = _.useRef(!1), l = _.useRef(!1), u = _.useRef(/* @__PURE__ */ new Map()), d = _.useRef(() => {});
	return _.useEffect(() => {
		function e() {
			l.current = !1, i.current = !1, u.current.clear();
		}
		lr(e, "resetOutsideInteraction");
		function t() {
			return Array.from(u.current.values()).some(Boolean);
		}
		lr(t, "isOutsideInteractionIntercepted");
		function f(e) {
			if (!l.current) return;
			let t = e.target;
			t instanceof Node && [...a].some((e) => e.contains(t)) || u.current.set(e.type, !0), e.type === "click" && window.setTimeout(() => {
				l.current && d.current();
			}, 0);
		}
		lr(f, "handleInteractionCapture");
		function p(e) {
			l.current && u.current.set(e.type, !1);
		}
		lr(p, "handleInteractionBubble");
		let m = /* @__PURE__ */ lr((a) => {
			if (a.target && !c.current) {
				let f = function() {
					n.removeEventListener("click", d.current);
					let r = t();
					e(), r || xr(dr, s, p, { discrete: !0 });
				};
				if (lr(f, "handleAndDispatchPointerDownOutsideEvent"), !o(a.target)) {
					n.removeEventListener("click", d.current), e(), c.current = !1;
					return;
				}
				let p = { originalEvent: a };
				l.current = !0, i.current = r && a.button === 0, u.current.clear(), !r || a.button !== 0 ? f() : (n.removeEventListener("click", d.current), d.current = f, n.addEventListener("click", d.current, { once: !0 }));
			} else n.removeEventListener("click", d.current), e();
			c.current = !1;
		}, "handlePointerDown"), h = [
			"pointerup",
			"mousedown",
			"mouseup",
			"touchstart",
			"touchend",
			"click"
		];
		for (let e of h) n.addEventListener(e, f, !0), n.addEventListener(e, p);
		let g = window.setTimeout(() => {
			n.addEventListener("pointerdown", m);
		}, 0);
		return () => {
			window.clearTimeout(g), n.removeEventListener("pointerdown", m), n.removeEventListener("click", d.current);
			for (let e of h) n.removeEventListener(e, f, !0), n.removeEventListener(e, p);
		};
	}, [
		n,
		s,
		r,
		i,
		a,
		o
	]), { onPointerDownCapture: /* @__PURE__ */ lr(() => c.current = !0, "onPointerDownCapture") };
}
lr(vr, "usePointerDownOutside");
function yr(e, t = globalThis?.document) {
	let n = sr(e), r = _.useRef(!1);
	return _.useEffect(() => {
		let e = /* @__PURE__ */ lr((e) => {
			e.target && !r.current && xr(fr, n, { originalEvent: e }, { discrete: !1 });
		}, "handleFocus");
		return t.addEventListener("focusin", e), () => t.removeEventListener("focusin", e);
	}, [t, n]), {
		onFocusCapture: /* @__PURE__ */ lr(() => r.current = !0, "onFocusCapture"),
		onBlurCapture: /* @__PURE__ */ lr(() => r.current = !1, "onBlurCapture")
	};
}
lr(yr, "useFocusOutside");
function br() {
	let e = new CustomEvent(ur);
	document.dispatchEvent(e);
}
lr(br, "dispatchUpdate");
function xr(e, t, n, { discrete: r }) {
	let i = n.originalEvent.target, a = new CustomEvent(e, {
		bubbles: !1,
		cancelable: !0,
		detail: n
	});
	t && i.addEventListener(e, t, { once: !0 }), r ? _n(i, a) : i.dispatchEvent(a);
}
lr(xr, "handleAndDispatchCustomEvent");
// node_modules/@radix-ui/react-focus-scope/dist/index.mjs
var Sr = Object.defineProperty, Cr = (e, t) => Sr(e, "name", {
	value: t,
	configurable: !0
}), wr = "focusScope.autoFocusOnMount", Tr = "focusScope.autoFocusOnUnmount", Er = {
	bubbles: !1,
	cancelable: !0
}, Dr = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ Cr(function(e, t) {
	let { loop: n = !1, trapped: r = !1, onMountAutoFocus: i, onUnmountAutoFocus: a, ...o } = e, [s, c] = _.useState(null), l = sr(i), u = sr(a), d = _.useRef(null), f = Xt(t, c), p = _.useRef({
		paused: !1,
		pause() {
			this.paused = !0;
		},
		resume() {
			this.paused = !1;
		}
	}).current;
	_.useEffect(() => {
		if (r) {
			let e = function(e) {
				if (p.paused || !s) return;
				let t = e.target;
				s.contains(t) ? d.current = t : Pr(d.current, { select: !0 });
			}, t = function(e) {
				if (p.paused || !s) return;
				let t = e.relatedTarget;
				t !== null && (s.contains(t) || Pr(d.current, { select: !0 }));
			}, n = function(e) {
				if (document.activeElement === document.body) for (let t of e) t.removedNodes.length > 0 && Pr(s);
			};
			Cr(e, "handleFocusIn"), Cr(t, "handleFocusOut"), Cr(n, "handleMutations"), document.addEventListener("focusin", e), document.addEventListener("focusout", t);
			let r = new MutationObserver(n);
			return s && r.observe(s, {
				childList: !0,
				subtree: !0
			}), () => {
				document.removeEventListener("focusin", e), document.removeEventListener("focusout", t), r.disconnect();
			};
		}
	}, [
		r,
		s,
		p.paused
	]), _.useEffect(() => {
		if (s) {
			Fr.add(p);
			let e = document.activeElement;
			if (!s.contains(e)) {
				let t = new CustomEvent(wr, Er);
				s.addEventListener(wr, l), s.dispatchEvent(t), t.defaultPrevented || (Or(Rr(Ar(s)), { select: !0 }), document.activeElement === e && Pr(s));
			}
			return () => {
				s.removeEventListener(wr, l), setTimeout(() => {
					let t = new CustomEvent(Tr, Er);
					s.addEventListener(Tr, u), s.dispatchEvent(t), t.defaultPrevented || Pr(e ?? document.body, { select: !0 }), s.removeEventListener(Tr, u), Fr.remove(p);
				}, 0);
			};
		}
	}, [
		s,
		l,
		u,
		p
	]);
	let m = _.useCallback((e) => {
		if (!n && !r || p.paused) return;
		let t = e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey, i = document.activeElement;
		if (t && i) {
			let t = e.currentTarget, [r, a] = kr(t);
			r && a ? !e.shiftKey && i === a ? (e.preventDefault(), n && Pr(r, { select: !0 })) : e.shiftKey && i === r && (e.preventDefault(), n && Pr(a, { select: !0 })) : i === t && e.preventDefault();
		}
	}, [
		n,
		r,
		p.paused
	]);
	return /* @__PURE__ */ (0, H.jsx)(gn.div, {
		tabIndex: -1,
		...o,
		ref: f,
		onKeyDown: m
	});
}, "FocusScope"));
function Or(e, { select: t = !1 } = {}) {
	let n = document.activeElement;
	for (let r of e) if (Pr(r, { select: t }), document.activeElement !== n) return;
}
Cr(Or, "focusFirst");
function kr(e) {
	let t = Ar(e);
	return [jr(t, e), jr(t.reverse(), e)];
}
Cr(kr, "getTabbableEdges");
function Ar(e) {
	let t = [], n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, { acceptNode: /* @__PURE__ */ Cr((e) => {
		let t = e.tagName === "INPUT" && e.type === "hidden";
		return e.disabled || e.hidden || t ? NodeFilter.FILTER_SKIP : e.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
	}, "acceptNode") });
	for (; n.nextNode();) t.push(n.currentNode);
	return t;
}
Cr(Ar, "getTabbableCandidates");
function jr(e, t) {
	let n = typeof t.checkVisibility == "function" && t.checkVisibility({ checkVisibilityCSS: !0 });
	for (let r of e) if (!(n ? !r.checkVisibility({ checkVisibilityCSS: !0 }) : Mr(r, { upTo: t }))) return r;
}
Cr(jr, "findVisible");
function Mr(e, { upTo: t }) {
	if (getComputedStyle(e).visibility === "hidden") return !0;
	for (; e;) {
		if (t !== void 0 && e === t) return !1;
		if (getComputedStyle(e).display === "none") return !0;
		e = e.parentElement;
	}
	return !1;
}
Cr(Mr, "isHidden");
function Nr(e) {
	return e instanceof HTMLInputElement && "select" in e;
}
Cr(Nr, "isSelectableInput");
function Pr(e, { select: t = !1 } = {}) {
	if (e && e.focus) {
		let n = document.activeElement;
		e.focus({ preventScroll: !0 }), e !== n && Nr(e) && t && e.select();
	}
}
Cr(Pr, "focus");
var Fr = Ir();
function Ir() {
	let e = [];
	return {
		add(t) {
			let n = e[0];
			t !== n && n?.pause(), e = Lr(e, t), e.unshift(t);
		},
		remove(t) {
			e = Lr(e, t), e[0]?.resume();
		}
	};
}
Cr(Ir, "createFocusScopesStack");
function Lr(e, t) {
	let n = [...e], r = n.indexOf(t);
	return r !== -1 && n.splice(r, 1), n;
}
Cr(Lr, "arrayRemove");
function Rr(e) {
	return e.filter((e) => e.tagName !== "A");
}
Cr(Rr, "removeLinks");
// node_modules/@radix-ui/react-portal/dist/index.mjs
var zr = Object.defineProperty, Br = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ ((e, t) => zr(e, "name", {
	value: t,
	configurable: !0
}))(function(e, t) {
	let { container: n, ...r } = e, [i, a] = _.useState(!1);
	jn(() => a(!0), []);
	let o = n || i && globalThis?.document?.body;
	return o ? v.createPortal(/* @__PURE__ */ (0, H.jsx)(gn.div, {
		...r,
		ref: t
	}), o) : null;
}, "Portal")), Vr = Object.defineProperty, Hr = (e, t) => Vr(e, "name", {
	value: t,
	configurable: !0
}), Ur = 0, Wr = null;
function Gr(e) {
	return Kr(), e.children;
}
Hr(Gr, "FocusGuards");
function Kr() {
	_.useEffect(() => {
		Wr ||= {
			start: qr(),
			end: qr()
		};
		let { start: e, end: t } = Wr;
		return document.body.firstElementChild !== e && document.body.insertAdjacentElement("afterbegin", e), document.body.lastElementChild !== t && document.body.insertAdjacentElement("beforeend", t), Ur++, () => {
			Ur === 1 && (Wr?.start.remove(), Wr?.end.remove(), Wr = null), Ur = Math.max(0, Ur - 1);
		};
	}, []);
}
Hr(Kr, "useFocusGuards");
function qr() {
	let e = document.createElement("span");
	return e.setAttribute("data-radix-focus-guard", ""), e.tabIndex = 0, e.style.outline = "none", e.style.opacity = "0", e.style.position = "fixed", e.style.pointerEvents = "none", e;
}
Hr(qr, "createFocusGuard");
// node_modules/tslib/tslib.es6.mjs
var Jr = function() {
	return Jr = Object.assign || function(e) {
		for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n], t) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
		return e;
	}, Jr.apply(this, arguments);
};
function Yr(e, t) {
	var n = {};
	for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
	if (e != null && typeof Object.getOwnPropertySymbols == "function") for (var i = 0, r = Object.getOwnPropertySymbols(e); i < r.length; i++) t.indexOf(r[i]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[i]) && (n[r[i]] = e[r[i]]);
	return n;
}
function Xr(e, t, n) {
	if (n || arguments.length === 2) for (var r = 0, i = t.length, a; r < i; r++) (a || !(r in t)) && (a ||= Array.prototype.slice.call(t, 0, r), a[r] = t[r]);
	return e.concat(a || Array.prototype.slice.call(t));
}
// node_modules/react-remove-scroll-bar/dist/es2015/constants.js
var Zr = "right-scroll-bar-position", Qr = "width-before-scroll-bar", $r = "with-scroll-bars-hidden", ei = "--removed-body-scroll-bar-size";
// node_modules/use-callback-ref/dist/es2015/assignRef.js
function ti(e, t) {
	return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
// node_modules/use-callback-ref/dist/es2015/useRef.js
function ni(e, t) {
	var n = (0, _.useState)(function() {
		return {
			value: e,
			callback: t,
			facade: {
				get current() {
					return n.value;
				},
				set current(e) {
					var t = n.value;
					t !== e && (n.value = e, n.callback(e, t));
				}
			}
		};
	})[0];
	return n.callback = t, n.facade;
}
// node_modules/use-callback-ref/dist/es2015/useMergeRef.js
var ri = typeof window < "u" ? _.useLayoutEffect : _.useEffect, ii = /* @__PURE__ */ new WeakMap();
function ai(e, t) {
	var n = ni(t || null, function(t) {
		return e.forEach(function(e) {
			return ti(e, t);
		});
	});
	return ri(function() {
		var t = ii.get(n);
		if (t) {
			var r = new Set(t), i = new Set(e), a = n.current;
			r.forEach(function(e) {
				i.has(e) || ti(e, null);
			}), i.forEach(function(e) {
				r.has(e) || ti(e, a);
			});
		}
		ii.set(n, e);
	}, [e]), n;
}
// node_modules/use-sidecar/dist/es2015/medium.js
function oi(e) {
	return e;
}
function si(e, t) {
	t === void 0 && (t = oi);
	var n = [], r = !1;
	return {
		read: function() {
			if (r) throw Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
			return n.length ? n[n.length - 1] : e;
		},
		useMedium: function(e) {
			var i = t(e, r);
			return n.push(i), function() {
				n = n.filter(function(e) {
					return e !== i;
				});
			};
		},
		assignSyncMedium: function(e) {
			for (r = !0; n.length;) {
				var t = n;
				n = [], t.forEach(e);
			}
			n = {
				push: function(t) {
					return e(t);
				},
				filter: function() {
					return n;
				}
			};
		},
		assignMedium: function(e) {
			r = !0;
			var t = [];
			if (n.length) {
				var i = n;
				n = [], i.forEach(e), t = n;
			}
			var a = function() {
				var n = t;
				t = [], n.forEach(e);
			}, o = function() {
				return Promise.resolve().then(a);
			};
			o(), n = {
				push: function(e) {
					t.push(e), o();
				},
				filter: function(e) {
					return t = t.filter(e), n;
				}
			};
		}
	};
}
function ci(e) {
	e === void 0 && (e = {});
	var t = si(null);
	return t.options = Jr({
		async: !0,
		ssr: !1
	}, e), t;
}
// node_modules/use-sidecar/dist/es2015/exports.js
var li = function(e) {
	var t = e.sideCar, n = Yr(e, ["sideCar"]);
	if (!t) throw Error("Sidecar: please provide `sideCar` property to import the right car");
	var r = t.read();
	if (!r) throw Error("Sidecar medium not found");
	return _.createElement(r, Jr({}, n));
};
li.isSideCarExport = !0;
function ui(e, t) {
	return e.useMedium(t), li;
}
// node_modules/react-remove-scroll/dist/es2015/medium.js
var di = ci(), fi = function() {}, pi = _.forwardRef(function(e, t) {
	var n = _.useRef(null), r = _.useState({
		onScrollCapture: fi,
		onWheelCapture: fi,
		onTouchMoveCapture: fi
	}), i = r[0], a = r[1], o = e.forwardProps, s = e.children, c = e.className, l = e.removeScrollBar, u = e.enabled, d = e.shards, f = e.sideCar, p = e.noRelative, m = e.noIsolation, h = e.inert, g = e.allowPinchZoom, v = e.as, y = v === void 0 ? "div" : v, b = e.gapMode, x = Yr(e, [
		"forwardProps",
		"children",
		"className",
		"removeScrollBar",
		"enabled",
		"shards",
		"sideCar",
		"noRelative",
		"noIsolation",
		"inert",
		"allowPinchZoom",
		"as",
		"gapMode"
	]), S = f, C = ai([n, t]), w = Jr(Jr({}, x), i);
	return _.createElement(_.Fragment, null, u && _.createElement(S, {
		sideCar: di,
		removeScrollBar: l,
		shards: d,
		noRelative: p,
		noIsolation: m,
		inert: h,
		setCallbacks: a,
		allowPinchZoom: !!g,
		lockRef: n,
		gapMode: b
	}), o ? _.cloneElement(_.Children.only(s), Jr(Jr({}, w), { ref: C })) : _.createElement(y, Jr({}, w, {
		className: c,
		ref: C
	}), s));
});
pi.defaultProps = {
	enabled: !0,
	removeScrollBar: !0,
	inert: !1
}, pi.classNames = {
	fullWidth: Qr,
	zeroRight: Zr
};
// node_modules/get-nonce/dist/es2015/index.js
var mi = function() {
	if (typeof __webpack_nonce__ < "u") return __webpack_nonce__;
};
// node_modules/react-style-singleton/dist/es2015/singleton.js
function hi() {
	if (!document) return null;
	var e = document.createElement("style");
	e.type = "text/css";
	var t = mi();
	return t && e.setAttribute("nonce", t), e;
}
function gi(e, t) {
	e.styleSheet ? e.styleSheet.cssText = t : e.appendChild(document.createTextNode(t));
}
function _i(e) {
	(document.head || document.getElementsByTagName("head")[0]).appendChild(e);
}
var vi = function() {
	var e = 0, t = null;
	return {
		add: function(n) {
			e == 0 && (t = hi()) && (gi(t, n), _i(t)), e++;
		},
		remove: function() {
			e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), t = null);
		}
	};
}, yi = function() {
	var e = vi();
	return function(t, n) {
		_.useEffect(function() {
			return e.add(t), function() {
				e.remove();
			};
		}, [t && n]);
	};
}, bi = function() {
	var e = yi();
	return function(t) {
		var n = t.styles, r = t.dynamic;
		return e(n, r), null;
	};
}, xi = {
	left: 0,
	top: 0,
	right: 0,
	gap: 0
}, Si = function(e) {
	return parseInt(e || "", 10) || 0;
}, Ci = function(e) {
	var t = window.getComputedStyle(document.body), n = t[e === "padding" ? "paddingLeft" : "marginLeft"], r = t[e === "padding" ? "paddingTop" : "marginTop"], i = t[e === "padding" ? "paddingRight" : "marginRight"];
	return [
		Si(n),
		Si(r),
		Si(i)
	];
}, wi = function(e) {
	if (e === void 0 && (e = "margin"), typeof window > "u") return xi;
	var t = Ci(e), n = document.documentElement.clientWidth, r = window.innerWidth;
	return {
		left: t[0],
		top: t[1],
		right: t[2],
		gap: Math.max(0, r - n + t[2] - t[0])
	};
}, Ti = bi(), Ei = "data-scroll-locked", Di = function(e, t, n, r) {
	var i = e.left, a = e.top, o = e.right, s = e.gap;
	return n === void 0 && (n = "margin"), `
  .${$r} {
   overflow: hidden ${r};
   padding-right: ${s}px ${r};
  }
  body[${Ei}] {
    overflow: hidden ${r};
    overscroll-behavior: contain;
    ${[
		t && `position: relative ${r};`,
		n === "margin" && `
    padding-left: ${i}px;
    padding-top: ${a}px;
    padding-right: ${o}px;
    margin-left:0;
    margin-top:0;
    margin-right: ${s}px ${r};
    `,
		n === "padding" && `padding-right: ${s}px ${r};`
	].filter(Boolean).join("")}
  }
  
  .${Zr} {
    right: ${s}px ${r};
  }
  
  .${Qr} {
    margin-right: ${s}px ${r};
  }
  
  .${Zr} .${Zr} {
    right: 0 ${r};
  }
  
  .${Qr} .${Qr} {
    margin-right: 0 ${r};
  }
  
  body[${Ei}] {
    ${ei}: ${s}px;
  }
`;
}, Oi = function() {
	var e = parseInt(document.body.getAttribute("data-scroll-locked") || "0", 10);
	return isFinite(e) ? e : 0;
}, ki = function() {
	_.useEffect(function() {
		return document.body.setAttribute(Ei, (Oi() + 1).toString()), function() {
			var e = Oi() - 1;
			e <= 0 ? document.body.removeAttribute(Ei) : document.body.setAttribute(Ei, e.toString());
		};
	}, []);
}, Ai = function(e) {
	var t = e.noRelative, n = e.noImportant, r = e.gapMode, i = r === void 0 ? "margin" : r;
	ki();
	var a = _.useMemo(function() {
		return wi(i);
	}, [i]);
	return _.createElement(Ti, { styles: Di(a, !t, i, n ? "" : "!important") });
}, U = !1;
if (typeof window < "u") try {
	var ji = Object.defineProperty({}, "passive", { get: function() {
		return U = !0, !0;
	} });
	window.addEventListener("test", ji, ji), window.removeEventListener("test", ji, ji);
} catch {
	U = !1;
}
var Mi = U ? { passive: !1 } : !1, Ni = function(e) {
	return e.tagName === "TEXTAREA";
}, Pi = function(e, t) {
	if (!(e instanceof Element)) return !1;
	var n = window.getComputedStyle(e);
	return n[t] !== "hidden" && !(n.overflowY === n.overflowX && !Ni(e) && n[t] === "visible");
}, Fi = function(e) {
	return Pi(e, "overflowY");
}, Ii = function(e) {
	return Pi(e, "overflowX");
}, Li = function(e, t) {
	var n = t.ownerDocument, r = t;
	do {
		if (typeof ShadowRoot < "u" && r instanceof ShadowRoot && (r = r.host), Bi(e, r)) {
			var i = Vi(e, r);
			if (i[1] > i[2]) return !0;
		}
		r = r.parentNode;
	} while (r && r !== n.body);
	return !1;
}, Ri = function(e) {
	return [
		e.scrollTop,
		e.scrollHeight,
		e.clientHeight
	];
}, zi = function(e) {
	return [
		e.scrollLeft,
		e.scrollWidth,
		e.clientWidth
	];
}, Bi = function(e, t) {
	return e === "v" ? Fi(t) : Ii(t);
}, Vi = function(e, t) {
	return e === "v" ? Ri(t) : zi(t);
}, Hi = function(e, t) {
	return e === "h" && t === "rtl" ? -1 : 1;
}, Ui = function(e, t, n, r, i) {
	var a = Hi(e, window.getComputedStyle(t).direction), o = a * r, s = n.target, c = t.contains(s), l = !1, u = o > 0, d = 0, f = 0;
	do {
		if (!s) break;
		var p = Vi(e, s), m = p[0], h = p[1] - p[2] - a * m;
		(m || h) && Bi(e, s) && (d += h, f += m);
		var g = s.parentNode;
		s = g && g.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? g.host : g;
	} while (!c && s !== document.body || c && (t.contains(s) || t === s));
	return (u && (i && Math.abs(d) < 1 || !i && o > d) || !u && (i && Math.abs(f) < 1 || !i && -o > f)) && (l = !0), l;
}, Wi = function(e) {
	return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
}, Gi = function(e) {
	return [e.deltaX, e.deltaY];
}, Ki = function(e) {
	return e && "current" in e ? e.current : e;
}, qi = function(e, t) {
	return e[0] === t[0] && e[1] === t[1];
}, Ji = function(e) {
	return `
  .block-interactivity-${e} {pointer-events: none;}
  .allow-interactivity-${e} {pointer-events: all;}
`;
}, Yi = 0, Xi = [];
function Zi(e) {
	var t = _.useRef([]), n = _.useRef([0, 0]), r = _.useRef(), i = _.useState(Yi++)[0], a = _.useState(bi)[0], o = _.useRef(e);
	_.useEffect(function() {
		o.current = e;
	}, [e]), _.useEffect(function() {
		if (e.inert) {
			document.body.classList.add(`block-interactivity-${i}`);
			var t = Xr([e.lockRef.current], (e.shards || []).map(Ki), !0).filter(Boolean);
			return t.forEach(function(e) {
				return e.classList.add(`allow-interactivity-${i}`);
			}), function() {
				document.body.classList.remove(`block-interactivity-${i}`), t.forEach(function(e) {
					return e.classList.remove(`allow-interactivity-${i}`);
				});
			};
		}
	}, [
		e.inert,
		e.lockRef.current,
		e.shards
	]);
	var s = _.useCallback(function(e, t) {
		if ("touches" in e && e.touches.length === 2 || e.type === "wheel" && e.ctrlKey) return !o.current.allowPinchZoom;
		var i = Wi(e), a = n.current, s = "deltaX" in e ? e.deltaX : a[0] - i[0], c = "deltaY" in e ? e.deltaY : a[1] - i[1], l, u = e.target, d = Math.abs(s) > Math.abs(c) ? "h" : "v";
		if ("touches" in e && d === "h" && u.type === "range") return !1;
		var f = window.getSelection(), p = f && f.anchorNode;
		if (p && (p === u || p.contains(u))) return !1;
		var m = Li(d, u);
		if (!m) return !0;
		if (m ? l = d : (l = d === "v" ? "h" : "v", m = Li(d, u)), !m) return !1;
		if (!r.current && "changedTouches" in e && (s || c) && (r.current = l), !l) return !0;
		var h = r.current || l;
		return Ui(h, t, e, h === "h" ? s : c, !0);
	}, []), c = _.useCallback(function(e) {
		var n = e;
		if (Xi.length && Xi[Xi.length - 1] === a) {
			var r = "deltaY" in n ? Gi(n) : Wi(n), i = t.current.filter(function(e) {
				return e.name === n.type && (e.target === n.target || n.target === e.shadowParent) && qi(e.delta, r);
			})[0];
			if (i && i.should) n.cancelable && n.preventDefault();
			else if (!i) {
				var c = (o.current.shards || []).map(Ki).filter(Boolean).filter(function(e) {
					return e.contains(n.target);
				});
				(c.length > 0 ? s(n, c[0]) : !o.current.noIsolation) && n.cancelable && n.preventDefault();
			}
		}
	}, []), l = _.useCallback(function(e, n, r, i) {
		var a = {
			name: e,
			delta: n,
			target: r,
			should: i,
			shadowParent: Qi(r)
		};
		t.current.push(a), setTimeout(function() {
			t.current = t.current.filter(function(e) {
				return e !== a;
			});
		}, 1);
	}, []), u = _.useCallback(function(e) {
		n.current = Wi(e), r.current = void 0;
	}, []), d = _.useCallback(function(t) {
		l(t.type, Gi(t), t.target, s(t, e.lockRef.current));
	}, []), f = _.useCallback(function(t) {
		l(t.type, Wi(t), t.target, s(t, e.lockRef.current));
	}, []);
	_.useEffect(function() {
		return Xi.push(a), e.setCallbacks({
			onScrollCapture: d,
			onWheelCapture: d,
			onTouchMoveCapture: f
		}), document.addEventListener("wheel", c, Mi), document.addEventListener("touchmove", c, Mi), document.addEventListener("touchstart", u, Mi), function() {
			Xi = Xi.filter(function(e) {
				return e !== a;
			}), document.removeEventListener("wheel", c, Mi), document.removeEventListener("touchmove", c, Mi), document.removeEventListener("touchstart", u, Mi);
		};
	}, []);
	var p = e.removeScrollBar, m = e.inert;
	return _.createElement(_.Fragment, null, m ? _.createElement(a, { styles: Ji(i) }) : null, p ? _.createElement(Ai, {
		noRelative: e.noRelative,
		gapMode: e.gapMode
	}) : null);
}
function Qi(e) {
	for (var t = null; e !== null;) e instanceof ShadowRoot && (t = e.host, e = e.host), e = e.parentNode;
	return t;
}
// node_modules/react-remove-scroll/dist/es2015/sidecar.js
var $i = ui(di, Zi), ea = _.forwardRef(function(e, t) {
	return _.createElement(pi, Jr({}, e, {
		ref: t,
		sideCar: $i
	}));
});
ea.classNames = pi.classNames;
// node_modules/aria-hidden/dist/es2015/index.js
var ta = function(e) {
	return typeof document > "u" ? null : (Array.isArray(e) ? e[0] : e).ownerDocument.body;
}, na = /* @__PURE__ */ new WeakMap(), ra = /* @__PURE__ */ new WeakMap(), ia = {}, aa = 0, oa = function(e) {
	return e && (e.host || oa(e.parentNode));
}, sa = function(e, t) {
	return t.map(function(t) {
		if (e.contains(t)) return t;
		var n = oa(t);
		return n && e.contains(n) ? n : (console.error("aria-hidden", t, "in not contained inside", e, ". Doing nothing"), null);
	}).filter(function(e) {
		return !!e;
	});
}, ca = function(e, t, n, r) {
	var i = sa(t, Array.isArray(e) ? e : [e]);
	ia[n] || (ia[n] = /* @__PURE__ */ new WeakMap());
	var a = ia[n], o = [], s = /* @__PURE__ */ new Set(), c = new Set(i), l = function(e) {
		e && !s.has(e) && (s.add(e), l(e.parentNode));
	};
	i.forEach(l);
	var u = function(e) {
		e && !c.has(e) && Array.prototype.forEach.call(e.children, function(e) {
			if (s.has(e)) u(e);
			else try {
				var t = e.getAttribute(r), i = t !== null && t !== "false", c = (na.get(e) || 0) + 1, l = (a.get(e) || 0) + 1;
				na.set(e, c), a.set(e, l), o.push(e), c === 1 && i && ra.set(e, !0), l === 1 && e.setAttribute(n, "true"), i || e.setAttribute(r, "true");
			} catch (t) {
				console.error("aria-hidden: cannot operate on ", e, t);
			}
		});
	};
	return u(t), s.clear(), aa++, function() {
		o.forEach(function(e) {
			var t = na.get(e) - 1, i = a.get(e) - 1;
			na.set(e, t), a.set(e, i), t || (ra.has(e) || e.removeAttribute(r), ra.delete(e)), i || e.removeAttribute(n);
		}), aa--, aa || (na = /* @__PURE__ */ new WeakMap(), na = /* @__PURE__ */ new WeakMap(), ra = /* @__PURE__ */ new WeakMap(), ia = {});
	};
}, la = function(e, t, n) {
	n === void 0 && (n = "data-aria-hidden");
	var r = Array.from(Array.isArray(e) ? e : [e]), i = t || ta(e);
	return i ? (r.push.apply(r, Array.from(i.querySelectorAll("[aria-live], script"))), ca(r, i, n, "aria-hidden")) : function() {
		return null;
	};
}, ua = Object.defineProperty, da = (e, t) => ua(e, "name", {
	value: t,
	configurable: !0
}), fa = "Dialog", [pa, ma] = /* @__PURE__ */ xn(fa), [ha, ga] = pa(fa), _a = /* @__PURE__ */ da((e) => {
	let { __scopeDialog: t, children: n, open: r, defaultOpen: i, onOpenChange: a, modal: o = !0 } = e, s = _.useRef(null), c = _.useRef(null), [l, u] = Bn({
		prop: r,
		defaultProp: i ?? !1,
		onChange: a,
		caller: fa
	}), [d, f] = _.useState(0), [p, m] = _.useState(0);
	return /* @__PURE__ */ (0, H.jsx)(ha, {
		scope: t,
		triggerRef: s,
		contentRef: c,
		contentId: ir(),
		titleId: ir(),
		descriptionId: ir(),
		titlePresent: d > 0,
		descriptionPresent: p > 0,
		setTitleCount: f,
		setDescriptionCount: m,
		open: l,
		onOpenChange: u,
		onOpenToggle: _.useCallback(() => u((e) => !e), [u]),
		modal: o,
		children: n
	});
}, "Dialog"), va = "DialogPortal", [ya, ba] = pa(va, { forceMount: void 0 }), xa = /* @__PURE__ */ da((e) => {
	let { __scopeDialog: t, forceMount: n, children: r, container: i } = e, a = ga(va, t);
	return /* @__PURE__ */ (0, H.jsx)(ya, {
		scope: t,
		forceMount: n,
		children: _.Children.map(r, (e) => /* @__PURE__ */ (0, H.jsx)(Jn, {
			present: n || a.open,
			children: /* @__PURE__ */ (0, H.jsx)(Br, {
				asChild: !0,
				container: i,
				children: e
			})
		}))
	});
}, "DialogPortal"), Sa = "DialogOverlay", Ca = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let n = ba(Sa, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = ga(Sa, e.__scopeDialog);
	return a.modal ? /* @__PURE__ */ (0, H.jsx)(Jn, {
		present: r || a.open,
		children: /* @__PURE__ */ (0, H.jsx)(Ta, {
			...i,
			ref: t
		})
	}) : null;
}, "DialogOverlay")), wa = /* @__PURE__ */ $t("DialogOverlay.RemoveScroll"), Ta = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ga(Sa, n), a = Xt(t, gr());
	return /* @__PURE__ */ (0, H.jsx)(ea, {
		as: wa,
		allowPinchZoom: !0,
		shards: [i.contentRef],
		children: /* @__PURE__ */ (0, H.jsx)(gn.div, {
			"data-state": La(i.open),
			...r,
			ref: a,
			style: {
				pointerEvents: "auto",
				...r.style
			}
		})
	});
}, "DialogOverlayImpl")), Ea = "DialogContent", Da = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let n = ba(Ea, e.__scopeDialog), { forceMount: r = n.forceMount, ...i } = e, a = ga(Ea, e.__scopeDialog);
	return /* @__PURE__ */ (0, H.jsx)(Jn, {
		present: r || a.open,
		children: a.modal ? /* @__PURE__ */ (0, H.jsx)(Oa, {
			...i,
			ref: t
		}) : /* @__PURE__ */ (0, H.jsx)(ka, {
			...i,
			ref: t
		})
	});
}, "DialogContent")), Oa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let n = ga(Ea, e.__scopeDialog), r = _.useRef(null), i = Xt(t, n.contentRef, r);
	return _.useEffect(() => {
		let e = r.current;
		if (e) return la(e);
	}, []), /* @__PURE__ */ (0, H.jsx)(Aa, {
		...e,
		ref: i,
		trapFocus: n.open,
		disableOutsidePointerEvents: n.open,
		onCloseAutoFocus: En(e.onCloseAutoFocus, (e) => {
			e.preventDefault(), n.triggerRef.current?.focus();
		}),
		onPointerDownOutside: En(e.onPointerDownOutside, (e) => {
			let t = e.detail.originalEvent, n = t.button === 0 && t.ctrlKey === !0;
			(t.button === 2 || n) && e.preventDefault();
		}),
		onFocusOutside: En(e.onFocusOutside, (e) => e.preventDefault())
	});
}, "DialogContentModal")), ka = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let n = ga(Ea, e.__scopeDialog), r = _.useRef(!1), i = _.useRef(!1);
	return /* @__PURE__ */ (0, H.jsx)(Aa, {
		...e,
		ref: t,
		trapFocus: !1,
		disableOutsidePointerEvents: !1,
		onCloseAutoFocus: (t) => {
			e.onCloseAutoFocus?.(t), t.defaultPrevented || (r.current || n.triggerRef.current?.focus(), t.preventDefault()), r.current = !1, i.current = !1;
		},
		onInteractOutside: (t) => {
			e.onInteractOutside?.(t), t.defaultPrevented || (r.current = !0, t.detail.originalEvent.type === "pointerdown" && (i.current = !0));
			let a = t.target;
			n.triggerRef.current?.contains(a) && t.preventDefault(), t.detail.originalEvent.type === "focusin" && i.current && t.preventDefault();
		}
	});
}, "DialogContentNonModal")), Aa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let { __scopeDialog: n, trapFocus: r, onOpenAutoFocus: i, onCloseAutoFocus: a, ...o } = e, s = ga(Ea, n);
	return Kr(), /* @__PURE__ */ (0, H.jsx)(H.Fragment, { children: /* @__PURE__ */ (0, H.jsx)(Dr, {
		asChild: !0,
		loop: !0,
		trapped: r,
		onMountAutoFocus: i,
		onUnmountAutoFocus: a,
		children: /* @__PURE__ */ (0, H.jsx)(hr, {
			role: "dialog",
			id: s.contentId,
			"aria-describedby": s.descriptionPresent ? s.descriptionId : void 0,
			"aria-labelledby": s.titlePresent ? s.titleId : void 0,
			"data-state": La(s.open),
			...o,
			ref: t,
			deferPointerDownOutside: !0,
			onDismiss: () => s.onOpenChange(!1)
		})
	}) });
}, "DialogContentImpl")), ja = "DialogTitle", Ma = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ga(ja, n), { setTitleCount: a } = i;
	return jn(() => (a((e) => e + 1), () => a((e) => e - 1)), [a]), /* @__PURE__ */ (0, H.jsx)(gn.h2, {
		id: i.titleId,
		...r,
		ref: t
	});
}, "DialogTitle")), Na = "DialogDescription", Pa = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ga(Na, n), { setDescriptionCount: a } = i;
	return jn(() => (a((e) => e + 1), () => a((e) => e - 1)), [a]), /* @__PURE__ */ (0, H.jsx)(gn.p, {
		id: i.descriptionId,
		...r,
		ref: t
	});
}, "DialogDescription")), Fa = "DialogClose", Ia = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ da(function(e, t) {
	let { __scopeDialog: n, ...r } = e, i = ga(Fa, n);
	return /* @__PURE__ */ (0, H.jsx)(gn.button, {
		type: "button",
		...r,
		ref: t,
		onClick: En(e.onClick, () => i.onOpenChange(!1))
	});
}, "DialogClose"));
function La(e) {
	return e ? "open" : "closed";
}
da(La, "getState");
// node_modules/@radix-ui/react-progress/dist/index.mjs
var Ra = Object.defineProperty, za = (e, t) => Ra(e, "name", {
	value: t,
	configurable: !0
}), Ba = "Progress", Va = 100, [Ha, Ua] = /* @__PURE__ */ xn(Ba), [Wa, Ga] = Ha(Ba), Ka = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ za(function(e, t) {
	let { __scopeProgress: n, value: r = null, max: i, getValueLabel: a = Ya, ...o } = e;
	(i || i === 0) && !Qa(i) && console.error(eo(`${i}`, "Progress"));
	let s = Qa(i) ? i : Va;
	r !== null && !$a(r, s) && console.error(to(`${r}`, "Progress"));
	let c = $a(r, s) ? r : null, l = Za(c) ? a(c, s) : void 0;
	return /* @__PURE__ */ (0, H.jsx)(Wa, {
		scope: n,
		value: c,
		max: s,
		children: /* @__PURE__ */ (0, H.jsx)(gn.div, {
			"aria-valuemax": s,
			"aria-valuemin": 0,
			"aria-valuenow": Za(c) ? c : void 0,
			"aria-valuetext": l,
			role: "progressbar",
			"data-state": Xa(c, s),
			"data-value": c ?? void 0,
			"data-max": s,
			...o,
			ref: t
		})
	});
}, "Progress")), qa = "ProgressIndicator", Ja = /* @__PURE__ */ _.forwardRef(/* @__PURE__ */ za(function(e, t) {
	let { __scopeProgress: n, ...r } = e, i = Ga(qa, n);
	return /* @__PURE__ */ (0, H.jsx)(gn.div, {
		"data-state": Xa(i.value, i.max),
		"data-value": i.value ?? void 0,
		"data-max": i.max,
		...r,
		ref: t
	});
}, "ProgressIndicator"));
function Ya(e, t) {
	return `${Math.round(e / t * 100)}%`;
}
za(Ya, "defaultGetValueLabel");
function Xa(e, t) {
	return e == null ? "indeterminate" : e === t ? "complete" : "loading";
}
za(Xa, "getProgressState");
function Za(e) {
	return typeof e == "number";
}
za(Za, "isNumber");
function Qa(e) {
	return Za(e) && !isNaN(e) && e > 0;
}
za(Qa, "isValidMaxNumber");
function $a(e, t) {
	return Za(e) && !isNaN(e) && e <= t && e >= 0;
}
za($a, "isValidValueNumber");
function eo(e, t) {
	return `Invalid prop \`max\` of value \`${e}\` supplied to \`${t}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${Va}\`.`;
}
za(eo, "getInvalidMaxError");
function to(e, t) {
	return `Invalid prop \`value\` of value \`${e}\` supplied to \`${t}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${Va} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`;
}
za(to, "getInvalidValueError");
var no = Ka, ro = Ja, io = ge("group/button inline-flex shrink-0 translate-x-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/80",
			outline: "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
			secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
			ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
			destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
			sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
			lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			icon: "size-8",
			"icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
			"icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
			"icon-lg": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function ao({ className: e, variant: t = "default", size: n = "default", asChild: r = !1, ...i }) {
	let a = r ? en : "button";
	return /* @__PURE__ */ (0, H.jsx)(a, {
		"data-slot": "button",
		"data-variant": t,
		"data-size": n,
		className: V(io({
			variant: t,
			size: n,
			className: e
		})),
		...i
	});
}
// src/components/ui/dialog.tsx
function oo({ ...e }) {
	return /* @__PURE__ */ (0, H.jsx)(_a, {
		"data-slot": "dialog",
		...e
	});
}
function so({ ...e }) {
	return /* @__PURE__ */ (0, H.jsx)(xa, {
		"data-slot": "dialog-portal",
		...e
	});
}
function co({ className: e, ...t }) {
	return /* @__PURE__ */ (0, H.jsx)(Ca, {
		"data-slot": "dialog-overlay",
		className: V("fixed inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs data-open:animate-overlay-in data-closed:animate-overlay-out motion-reduce:animate-none!", e),
		...t
	});
}
function W({ className: e, children: t, showCloseButton: n = !0, container: r, ...i }) {
	return /* @__PURE__ */ (0, H.jsxs)(so, {
		container: r,
		children: [/* @__PURE__ */ (0, H.jsx)(co, {}), /* @__PURE__ */ (0, H.jsxs)(Da, {
			"data-slot": "dialog-content",
			className: V("fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm data-open:animate-dialog-in data-closed:animate-dialog-out motion-reduce:animate-none!", e),
			...i,
			children: [t, n && /* @__PURE__ */ (0, H.jsx)(Ia, {
				"data-slot": "dialog-close",
				asChild: !0,
				children: /* @__PURE__ */ (0, H.jsxs)(ao, {
					variant: "ghost",
					className: "absolute top-2 right-2",
					size: "icon-sm",
					children: [/* @__PURE__ */ (0, H.jsx)(me, {}), /* @__PURE__ */ (0, H.jsx)("span", {
						className: "sr-only",
						children: "Close"
					})]
				})
			})]
		})]
	});
}
function G({ className: e, ...t }) {
	return /* @__PURE__ */ (0, H.jsx)("div", {
		"data-slot": "dialog-header",
		className: V("flex flex-col gap-2", e),
		...t
	});
}
function lo({ className: e, ...t }) {
	return /* @__PURE__ */ (0, H.jsx)(Ma, {
		"data-slot": "dialog-title",
		className: V("font-heading text-base leading-none font-medium", e),
		...t
	});
}
function uo({ className: e, ...t }) {
	return /* @__PURE__ */ (0, H.jsx)(Pa, {
		"data-slot": "dialog-description",
		className: V("text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground", e),
		...t
	});
}
// src/components/panel.tsx
function fo({ className: e, inverted: t = !1, muted: n = !1, ...r }) {
	return /* @__PURE__ */ (0, H.jsx)("kbd", {
		"data-slot": "kbd",
		className: V("inline-flex h-[1.125rem] min-w-[1.125rem] shrink-0 items-center justify-center rounded-[0.25rem] px-1 font-sans text-[0.6875rem] leading-[1.125rem] font-medium", t ? "bg-primary-foreground/15 text-primary-foreground" : n ? "bg-muted text-foreground/70" : "bg-background text-foreground/70 shadow-[0_0_0_0.0625rem] shadow-foreground/12", e),
		...r
	});
}
function po({ keys: e, children: t }) {
	return /* @__PURE__ */ (0, H.jsxs)("span", {
		className: "inline-flex shrink-0 items-center gap-1",
		children: [e.map((e) => /* @__PURE__ */ (0, H.jsx)(fo, { children: e }, e)), t ? /* @__PURE__ */ (0, H.jsx)("span", {
			className: "ml-0.5",
			children: t
		}) : null]
	});
}
function mo({ action: e = !1, children: t, className: n, end: r }) {
	return /* @__PURE__ */ (0, H.jsxs)("div", {
		"data-slot": "panel-footer",
		className: V("flex shrink-0 items-center gap-3 border-t bg-muted/50 text-xs leading-4 text-muted-foreground", e ? "h-12 pr-2 pl-3" : "h-10 px-3", t ? "justify-between" : "justify-end", n),
		children: [t ? /* @__PURE__ */ (0, H.jsx)("div", {
			className: "flex min-w-0 items-center gap-3",
			children: t
		}) : null, r ? /* @__PURE__ */ (0, H.jsx)("div", {
			className: V("flex shrink-0 items-center", e ? "gap-1" : "gap-3"),
			children: r
		}) : null]
	});
}
function ho({ children: e, className: t, keys: n = "↵", ...r }) {
	return /* @__PURE__ */ (0, H.jsxs)(ao, {
		className: V("gap-2 rounded-[0.5rem] pr-1.5 pl-3", t),
		...r,
		children: [e, /* @__PURE__ */ (0, H.jsx)(fo, {
			"aria-hidden": "true",
			inverted: !0,
			children: n
		})]
	});
}
function go({ children: e = "Cancel", className: t, ...n }) {
	return /* @__PURE__ */ (0, H.jsxs)(ao, {
		className: V("mr-1 gap-2 rounded-[0.5rem] bg-background pr-1.5 pl-3 text-foreground ring-1 ring-foreground/10 hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50", t),
		variant: "ghost",
		...n,
		children: [e, /* @__PURE__ */ (0, H.jsx)(fo, {
			"aria-hidden": "true",
			muted: !0,
			children: "esc"
		})]
	});
}
// node_modules/cmdk/dist/chunk-NZJY6EH4.mjs
var _o = 1, vo = .9, yo = .8, bo = .17, xo = .1, So = .999, Co = .9999, wo = .99, To = /[\\\/_+.#"@\[\(\{&]/, Eo = /[\\\/_+.#"@\[\(\{&]/g, Do = /[\s-]/, Oo = /[\s-]/g;
function ko(e, t, n, r, i, a, o) {
	if (a === t.length) return i === e.length ? _o : wo;
	var s = `${i},${a}`;
	if (o[s] !== void 0) return o[s];
	for (var c = r.charAt(a), l = n.indexOf(c, i), u = 0, d, f, p, m; l >= 0;) d = ko(e, t, n, r, l + 1, a + 1, o), d > u && (l === i ? d *= _o : To.test(e.charAt(l - 1)) ? (d *= yo, p = e.slice(i, l - 1).match(Eo), p && i > 0 && (d *= So ** +p.length)) : Do.test(e.charAt(l - 1)) ? (d *= vo, m = e.slice(i, l - 1).match(Oo), m && i > 0 && (d *= So ** +m.length)) : (d *= bo, i > 0 && (d *= So ** +(l - i))), e.charAt(l) !== t.charAt(a) && (d *= Co)), (d < xo && n.charAt(l - 1) === r.charAt(a + 1) || r.charAt(a + 1) === r.charAt(a) && n.charAt(l - 1) !== r.charAt(a)) && (f = ko(e, t, n, r, l + 1, a + 2, o), f * xo > d && (d = f * xo)), d > u && (u = d), l = n.indexOf(c, l + 1);
	return o[s] = u, u;
}
function Ao(e) {
	return e.toLowerCase().replace(Oo, " ");
}
function jo(e, t, n) {
	return e = n && n.length > 0 ? `${e + " " + n.join(" ")}` : e, ko(e, t, Ao(e), Ao(t), 0, 0, {});
}
// node_modules/cmdk/dist/index.mjs
var Mo = "[cmdk-group=\"\"]", No = "[cmdk-group-items=\"\"]", Po = "[cmdk-group-heading=\"\"]", Fo = "[cmdk-item=\"\"]", Io = `${Fo}:not([aria-disabled="true"])`, Lo = "cmdk-item-select", Ro = "data-value", zo = (e, t, n) => jo(e, t, n), Bo = _.createContext(void 0), Vo = () => _.useContext(Bo), Ho = _.createContext(void 0), Uo = () => _.useContext(Ho), Wo = _.createContext(void 0), Go = _.forwardRef((e, t) => {
	let n = as(() => ({
		search: "",
		value: e.value ?? e.defaultValue ?? "",
		selectedItemId: void 0,
		filtered: {
			count: 0,
			items: /* @__PURE__ */ new Map(),
			groups: /* @__PURE__ */ new Set()
		}
	})), r = as(() => /* @__PURE__ */ new Set()), i = as(() => /* @__PURE__ */ new Map()), a = as(() => /* @__PURE__ */ new Map()), o = as(() => /* @__PURE__ */ new Set()), s = rs(e), { label: c, children: l, value: u, onValueChange: d, filter: f, shouldFilter: p, loop: m, disablePointerSelection: h = !1, vimBindings: g = !0, ...v } = e, y = ir(), b = ir(), x = ir(), S = _.useRef(null), C = cs();
	is(() => {
		if (u !== void 0) {
			let e = u.trim();
			n.current.value = e, w.emit();
		}
	}, [u]), is(() => {
		C(6, O);
	}, []);
	let w = _.useMemo(() => ({
		subscribe: (e) => (o.current.add(e), () => o.current.delete(e)),
		snapshot: () => n.current,
		setState: (e, t, r) => {
			var i, a, o;
			if (!Object.is(n.current[e], t)) {
				if (n.current[e] = t, e === "search") te(), E(), C(1, D);
				else if (e === "value") {
					if (document.activeElement.hasAttribute("cmdk-input") || document.activeElement.hasAttribute("cmdk-root")) {
						let e = document.getElementById(x);
						e ? e.focus() : (i = document.getElementById(y)) == null || i.focus();
					}
					if (C(7, () => {
						n.current.selectedItemId = ne()?.id, w.emit();
					}), r || C(5, O), s.current?.value !== void 0) {
						let e = t ?? "";
						(o = (a = s.current).onValueChange) == null || o.call(a, e);
						return;
					}
				}
				w.emit();
			}
		},
		emit: () => {
			o.current.forEach((e) => e());
		}
	}), []), T = _.useMemo(() => ({
		value: (e, t, r) => {
			t !== a.current.get(e)?.value && (a.current.set(e, {
				value: t,
				keywords: r
			}), n.current.filtered.items.set(e, ee(t, r)), C(2, () => {
				E(), w.emit();
			}));
		},
		item: (e, t) => (r.current.add(e), t && (i.current.has(t) ? i.current.get(t).add(e) : i.current.set(t, /* @__PURE__ */ new Set([e]))), C(3, () => {
			te(), E(), n.current.value || D(), w.emit();
		}), () => {
			a.current.delete(e), r.current.delete(e), n.current.filtered.items.delete(e);
			let t = ne();
			C(4, () => {
				te(), t?.getAttribute("id") === e && D(), w.emit();
			});
		}),
		group: (e) => (i.current.has(e) || i.current.set(e, /* @__PURE__ */ new Set()), () => {
			a.current.delete(e), i.current.delete(e);
		}),
		filter: () => s.current.shouldFilter,
		label: c || e["aria-label"],
		getDisablePointerSelection: () => s.current.disablePointerSelection,
		listId: y,
		inputId: x,
		labelId: b,
		listInnerRef: S
	}), []);
	function ee(e, t) {
		let r = s.current?.filter ?? zo;
		return e ? r(e, n.current.search, t) : 0;
	}
	function E() {
		if (!n.current.search || s.current.shouldFilter === !1) return;
		let e = n.current.filtered.items, t = [];
		n.current.filtered.groups.forEach((n) => {
			let r = i.current.get(n), a = 0;
			r.forEach((t) => {
				let n = e.get(t);
				a = Math.max(n, a);
			}), t.push([n, a]);
		});
		let r = S.current;
		k().sort((t, n) => {
			let r = t.getAttribute("id"), i = n.getAttribute("id");
			return (e.get(i) ?? 0) - (e.get(r) ?? 0);
		}).forEach((e) => {
			let t = e.closest(No);
			t ? t.appendChild(e.parentElement === t ? e : e.closest(`${No} > *`)) : r.appendChild(e.parentElement === r ? e : e.closest(`${No} > *`));
		}), t.sort((e, t) => t[1] - e[1]).forEach((e) => {
			let t = S.current?.querySelector(`${Mo}[${Ro}="${encodeURIComponent(e[0])}"]`);
			t?.parentElement.appendChild(t);
		});
	}
	function D() {
		let e = k().find((e) => e.getAttribute("aria-disabled") !== "true")?.getAttribute(Ro);
		w.setState("value", e || void 0);
	}
	function te() {
		if (!n.current.search || s.current.shouldFilter === !1) {
			n.current.filtered.count = r.current.size;
			return;
		}
		n.current.filtered.groups = /* @__PURE__ */ new Set();
		let e = 0;
		for (let t of r.current) {
			let r = ee(a.current.get(t)?.value ?? "", a.current.get(t)?.keywords ?? []);
			n.current.filtered.items.set(t, r), r > 0 && e++;
		}
		for (let [e, t] of i.current) for (let r of t) if (n.current.filtered.items.get(r) > 0) {
			n.current.filtered.groups.add(e);
			break;
		}
		n.current.filtered.count = e;
	}
	function O() {
		var e;
		let t = ne();
		t && (t.parentElement?.firstChild === t && ((e = t.closest(Mo)?.querySelector(Po)) == null || e.scrollIntoView({ block: "nearest" })), t.scrollIntoView({ block: "nearest" }));
	}
	function ne() {
		return S.current?.querySelector(`${Fo}[aria-selected="true"]`);
	}
	function k() {
		return Array.from(S.current?.querySelectorAll(Io) || []);
	}
	function re(e) {
		let t = k()[e];
		t && w.setState("value", t.getAttribute(Ro));
	}
	function ie(e) {
		var t;
		let n = ne(), r = k(), i = r.findIndex((e) => e === n), a = r[i + e];
		(t = s.current) != null && t.loop && (a = i + e < 0 ? r[r.length - 1] : i + e === r.length ? r[0] : r[i + e]), a && w.setState("value", a.getAttribute(Ro));
	}
	function ae(e) {
		let t = ne()?.closest(Mo), n;
		for (; t && !n;) t = e > 0 ? ts(t, Mo) : ns(t, Mo), n = t?.querySelector(Io);
		n ? w.setState("value", n.getAttribute(Ro)) : ie(e);
	}
	let A = () => re(k().length - 1), j = (e) => {
		e.preventDefault(), e.metaKey ? A() : e.altKey ? ae(1) : ie(1);
	}, oe = (e) => {
		e.preventDefault(), e.metaKey ? re(0) : e.altKey ? ae(-1) : ie(-1);
	};
	return _.createElement(gn.div, {
		ref: t,
		tabIndex: -1,
		...v,
		"cmdk-root": "",
		onKeyDown: (e) => {
			var t;
			(t = v.onKeyDown) == null || t.call(v, e);
			let n = e.nativeEvent.isComposing || e.keyCode === 229;
			if (!(e.defaultPrevented || n)) switch (e.key) {
				case "n":
				case "j":
					g && e.ctrlKey && j(e);
					break;
				case "ArrowDown":
					j(e);
					break;
				case "p":
				case "k":
					g && e.ctrlKey && oe(e);
					break;
				case "ArrowUp":
					oe(e);
					break;
				case "Home":
					e.preventDefault(), re(0);
					break;
				case "End":
					e.preventDefault(), A();
					break;
				case "Enter": {
					e.preventDefault();
					let t = ne();
					if (t) {
						let e = new Event(Lo);
						t.dispatchEvent(e);
					}
				}
			}
		}
	}, _.createElement("label", {
		"cmdk-label": "",
		htmlFor: T.inputId,
		id: T.labelId,
		style: ds
	}, c), us(e, (e) => _.createElement(Ho.Provider, { value: w }, _.createElement(Bo.Provider, { value: T }, e))));
}), Ko = _.forwardRef((e, t) => {
	let n = ir(), r = _.useRef(null), i = _.useContext(Wo), a = Vo(), o = rs(e), s = o.current?.forceMount ?? i?.forceMount;
	is(() => {
		if (!s) return a.item(n, i?.id);
	}, [s]);
	let c = ss(n, r, [
		e.value,
		e.children,
		r
	], e.keywords), l = Uo(), u = os((e) => e.value && e.value === c.current), d = os((e) => s || a.filter() === !1 ? !0 : !e.search || e.filtered.items.get(n) > 0);
	_.useEffect(() => {
		let t = r.current;
		if (t && !e.disabled) return t.addEventListener(Lo, f), () => t.removeEventListener(Lo, f);
	}, [
		d,
		e.onSelect,
		e.disabled
	]);
	function f() {
		var e, t;
		p(), (t = (e = o.current).onSelect) == null || t.call(e, c.current);
	}
	function p() {
		l.setState("value", c.current, !0);
	}
	if (!d) return null;
	let { disabled: m, value: h, onSelect: g, forceMount: v, keywords: y, ...b } = e;
	return _.createElement(gn.div, {
		ref: Yt(r, t),
		...b,
		id: n,
		"cmdk-item": "",
		role: "option",
		"aria-disabled": !!m,
		"aria-selected": !!u,
		"data-disabled": !!m,
		"data-selected": !!u,
		onPointerMove: m || a.getDisablePointerSelection() ? void 0 : p,
		onClick: m ? void 0 : f
	}, e.children);
}), qo = _.forwardRef((e, t) => {
	let { heading: n, children: r, forceMount: i, ...a } = e, o = ir(), s = _.useRef(null), c = _.useRef(null), l = ir(), u = Vo(), d = os((e) => i || u.filter() === !1 ? !0 : !e.search || e.filtered.groups.has(o));
	is(() => u.group(o), []), ss(o, s, [
		e.value,
		e.heading,
		c
	]);
	let f = _.useMemo(() => ({
		id: o,
		forceMount: i
	}), [i]);
	return _.createElement(gn.div, {
		ref: Yt(s, t),
		...a,
		"cmdk-group": "",
		role: "presentation",
		hidden: !d || void 0
	}, n && _.createElement("div", {
		ref: c,
		"cmdk-group-heading": "",
		"aria-hidden": !0,
		id: l
	}, n), us(e, (e) => _.createElement("div", {
		"cmdk-group-items": "",
		role: "group",
		"aria-labelledby": n ? l : void 0
	}, _.createElement(Wo.Provider, { value: f }, e))));
}), Jo = _.forwardRef((e, t) => {
	let { alwaysRender: n, ...r } = e, i = _.useRef(null), a = os((e) => !e.search);
	return !n && !a ? null : _.createElement(gn.div, {
		ref: Yt(i, t),
		...r,
		"cmdk-separator": "",
		role: "separator"
	});
}), Yo = _.forwardRef((e, t) => {
	let { onValueChange: n, ...r } = e, i = e.value != null, a = Uo(), o = os((e) => e.search), s = os((e) => e.selectedItemId), c = Vo();
	return _.useEffect(() => {
		e.value != null && a.setState("search", e.value);
	}, [e.value]), _.createElement(gn.input, {
		ref: t,
		...r,
		"cmdk-input": "",
		autoComplete: "off",
		autoCorrect: "off",
		spellCheck: !1,
		"aria-autocomplete": "list",
		role: "combobox",
		"aria-expanded": !0,
		"aria-controls": c.listId,
		"aria-labelledby": c.labelId,
		"aria-activedescendant": s,
		id: c.inputId,
		type: "text",
		value: i ? e.value : o,
		onChange: (e) => {
			i || a.setState("search", e.target.value), n?.(e.target.value);
		}
	});
}), Xo = _.forwardRef((e, t) => {
	let { children: n, label: r = "Suggestions", ...i } = e, a = _.useRef(null), o = _.useRef(null), s = os((e) => e.selectedItemId), c = Vo();
	return _.useEffect(() => {
		if (o.current && a.current) {
			let e = o.current, t = a.current, n, r = new ResizeObserver(() => {
				n = requestAnimationFrame(() => {
					let n = e.offsetHeight;
					t.style.setProperty("--cmdk-list-height", n.toFixed(1) + "px");
				});
			});
			return r.observe(e), () => {
				cancelAnimationFrame(n), r.unobserve(e);
			};
		}
	}, []), _.createElement(gn.div, {
		ref: Yt(a, t),
		...i,
		"cmdk-list": "",
		role: "listbox",
		tabIndex: -1,
		"aria-activedescendant": s,
		"aria-label": r,
		id: c.listId
	}, us(e, (e) => _.createElement("div", {
		ref: Yt(o, c.listInnerRef),
		"cmdk-list-sizer": ""
	}, e)));
}), Zo = _.forwardRef((e, t) => {
	let { open: n, onOpenChange: r, overlayClassName: i, contentClassName: a, container: o, ...s } = e;
	return _.createElement(_a, {
		open: n,
		onOpenChange: r
	}, _.createElement(xa, { container: o }, _.createElement(Ca, {
		"cmdk-overlay": "",
		className: i
	}), _.createElement(Da, {
		"aria-label": e.label,
		"cmdk-dialog": "",
		className: a
	}, _.createElement(Go, {
		ref: t,
		...s
	}))));
}), Qo = _.forwardRef((e, t) => os((e) => e.filtered.count === 0) ? _.createElement(gn.div, {
	ref: t,
	...e,
	"cmdk-empty": "",
	role: "presentation"
}) : null), $o = _.forwardRef((e, t) => {
	let { progress: n, children: r, label: i = "Loading...", ...a } = e;
	return _.createElement(gn.div, {
		ref: t,
		...a,
		"cmdk-loading": "",
		role: "progressbar",
		"aria-valuenow": n,
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-label": i
	}, us(e, (e) => _.createElement("div", { "aria-hidden": !0 }, e)));
}), es = Object.assign(Go, {
	List: Xo,
	Item: Ko,
	Input: Yo,
	Group: qo,
	Separator: Jo,
	Dialog: Zo,
	Empty: Qo,
	Loading: $o
});
function ts(e, t) {
	let n = e.nextElementSibling;
	for (; n;) {
		if (n.matches(t)) return n;
		n = n.nextElementSibling;
	}
}
function ns(e, t) {
	let n = e.previousElementSibling;
	for (; n;) {
		if (n.matches(t)) return n;
		n = n.previousElementSibling;
	}
}
function rs(e) {
	let t = _.useRef(e);
	return is(() => {
		t.current = e;
	}), t;
}
var is = typeof window > "u" ? _.useEffect : _.useLayoutEffect;
function as(e) {
	let t = _.useRef();
	return t.current === void 0 && (t.current = e()), t;
}
function os(e) {
	let t = Uo(), n = () => e(t.snapshot());
	return _.useSyncExternalStore(t.subscribe, n, n);
}
function ss(e, t, n, r = []) {
	let i = _.useRef(), a = Vo();
	return is(() => {
		var o;
		let s = (() => {
			for (let e of n) {
				if (typeof e == "string") return e.trim();
				if (typeof e == "object" && "current" in e) return e.current ? e.current.textContent?.trim() : i.current;
			}
		})(), c = r.map((e) => e.trim());
		a.value(e, s, c), (o = t.current) == null || o.setAttribute(Ro, s), i.current = s;
	}), i;
}
var cs = () => {
	let [e, t] = _.useState(), n = as(() => /* @__PURE__ */ new Map());
	return is(() => {
		n.current.forEach((e) => e()), n.current = /* @__PURE__ */ new Map();
	}, [e]), (e, r) => {
		n.current.set(e, r), t({});
	};
};
function ls(e) {
	let t = e.type;
	return typeof t == "function" ? t(e.props) : "render" in t ? t.render(e.props) : e;
}
function us({ asChild: e, children: t }, n) {
	return e && _.isValidElement(t) ? _.cloneElement(ls(t), { ref: t.ref }, n(t.props.children)) : n(t);
}
var ds = {
	position: "absolute",
	width: "1px",
	height: "1px",
	padding: "0",
	margin: "-1px",
	overflow: "hidden",
	clip: "rect(0, 0, 0, 0)",
	whiteSpace: "nowrap",
	borderWidth: "0"
};
// src/lib/fadeMask.ts
function fs(e) {
	let t = e.scrollHeight - e.clientHeight > 1, n = t && e.scrollTop > 1, r = t && e.scrollTop + e.clientHeight < e.scrollHeight - 1;
	return n && r ? "both" : n ? "top" : r ? "bottom" : "none";
}
// src/lib/searchScore.ts
var ps = 1, ms = .85, hs = .7, gs = .55, _s = .45, vs = .2, ys = /[/\-_.]+/g;
function bs(e) {
	return e.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
function xs(e) {
	let t = bs(e).replace(ys, " ").trim().split(/\s+/u);
	return t[0] ? t : [];
}
function Ss(e) {
	return bs(e).replace(ys, "").replace(/\s+/gu, "");
}
function Cs(e, t) {
	let n = 0;
	for (let r of t) if (r === e[n] && (n += 1, n === e.length)) return !0;
	return !1;
}
function ws(e, t) {
	let n = e.length - t.length;
	if (Math.abs(n) > 1 || e === t) return n === 0 && e === t;
	let r = e, i = t;
	n > 0 && (r = t, i = e);
	let a = 0;
	for (; a < r.length && r[a] === i[a];) a += 1;
	return a === r.length ? i.length - r.length === 1 : r.length === i.length ? a + 1 < r.length && r[a] === i[a + 1] && r[a + 1] === i[a] && r.slice(a + 2) === i.slice(a + 2) || r.slice(a + 1) === i.slice(a + 1) : r.slice(a) === i.slice(a + 1);
}
function Ts(e, t, n, r) {
	let i = 0;
	for (let n of t) {
		if (n === e) return ps;
		n.startsWith(e) && (i = Math.max(i, ms)), n.includes(e) && (i = Math.max(i, gs)), e.length >= 4 && ws(e, n) && (i = Math.max(i, _s)), e.length >= 3 && Cs(e, n) && (i = Math.max(i, vs));
	}
	return (r === e || e.length >= 2 && r.startsWith(e)) && (i = Math.max(i, hs)), n.includes(e) && (i = Math.max(i, gs)), i;
}
function Es(e, t) {
	let n = xs(t);
	if (n.length === 0) return 1;
	let r = xs(e), i = Ss(e), a = r.map((e) => e[0] ?? "").join(""), o = 0;
	for (let e of n) {
		let t = Ts(e, r, i, a);
		if (t === 0) return 0;
		o += t;
	}
	return o;
}
function Ds(e, t, n = []) {
	if (!t.trim()) return 1;
	let r = Es(e, t);
	for (let e of n) r = Math.max(r, Es(e, t));
	return n.length > 0 && (r = Math.max(r, Es(`${e} ${n.join(" ")}`, t))), r;
}
// src/components/ui/command.tsx
var Os = 200, ks = "cubic-bezier(0.16, 1, 0.3, 1)", As = .75, js = 8, Ms = 12, Ns = 150, Ps = 110;
function Fs(e) {
	return !!e?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
function Is(e) {
	if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
	let t = e.target;
	t instanceof HTMLButtonElement && !t.disabled && (e.preventDefault(), t.click());
}
function Ls({ className: e, filter: t = Ds, loop: n = !0, ...r }) {
	return /* @__PURE__ */ (0, H.jsx)(es, {
		"data-slot": "command",
		className: V("flex size-full min-h-0 flex-col overflow-hidden rounded-xl! bg-popover text-sm text-popover-foreground", e),
		filter: t,
		loop: n,
		...r
	});
}
function Rs(e) {
	e && !Fs(e.ownerDocument.defaultView) && Array.from(e.querySelectorAll("[cmdk-item]")).slice(0, js).forEach((e, t) => {
		typeof e.animate == "function" && e.animate([{
			opacity: 0,
			transform: "translateY(0.25rem)"
		}, {
			opacity: 1,
			transform: "none"
		}], {
			delay: t * Ms,
			duration: Ns,
			easing: ks,
			fill: "backwards"
		});
	});
}
function zs({ children: e, commandRef: t, contentDepth: n = 0, contentKey: r, contentRef: i, defaultValue: a, filter: o, onKeyDown: s, title: c }) {
	let l = _.useRef(null), u = _.useRef(null), d = _.useRef(r), f = _.useRef(n), p = _.useRef(As), m = _.useRef(!1), h = m.current && d.current !== r;
	return h && (p.current = n < f.current ? -.75 : As), d.current = r, f.current = n, m.current = !0, _.useLayoutEffect(() => {
		Rs(t.current);
	}, [t, r]), _.useLayoutEffect(() => {
		let e = t.current, n = i.current ?? e?.parentElement;
		if (!n || !e) return;
		let r = l.current, a = n.ownerDocument.defaultView, o = r != null && !Fs(a) && typeof n.animate == "function", s = o ? performance.now() + Os : 0, c = r, d = (e) => {
			if (e === c) return;
			let t = u.current ? n.offsetHeight : c ?? e;
			if (u.current?.cancel(), u.current = null, c = e, l.current = e, t === e) return;
			let r = n.animate([{ height: `${t}px` }, { height: `${e}px` }], {
				duration: Os,
				easing: ks
			});
			u.current = r;
			let i = () => {
				u.current === r && (u.current = null);
			};
			r.onfinish = i, r.oncancel = i;
		}, f = () => {
			let t = e.offsetHeight;
			u.current || performance.now() < s ? d(t) : (s = 0, c = t, l.current = t);
		};
		o ? d(e.offsetHeight) : l.current = e.offsetHeight;
		let p = typeof ResizeObserver > "u" ? null : new ResizeObserver(f);
		return p?.observe(e), () => {
			p?.disconnect(), u.current && (l.current = n.offsetHeight), u.current?.cancel(), u.current = null;
		};
	}, [
		t,
		r,
		i
	]), /* @__PURE__ */ (0, H.jsx)(Ls, {
		ref: t,
		className: h ? "animate-surface-in motion-reduce:animate-none!" : void 0,
		style: {
			"--surface-shift": `${p.current}rem`,
			height: "auto",
			alignSelf: "start"
		},
		defaultValue: a,
		filter: o,
		label: c === "Accounts" ? "Search accounts" : "Search commands",
		onKeyDown: (e) => {
			s?.(e), e.defaultPrevented || Is(e);
		},
		tabIndex: -1,
		children: e
	}, r);
}
function Bs({ title: e = "Command Palette", description: t = "Search for a command to run...", children: n, className: r, showCloseButton: i = !1, container: a, contentDepth: o, contentKey: s, defaultValue: c, filter: l, onEscapeKeyDown: u, onKeyDown: d, ...f }) {
	let p = _.useRef(null), m = _.useRef(null);
	return _.useLayoutEffect(() => {
		let e = p.current;
		if (s === void 0 || !e || e.querySelector("input, textarea, [contenteditable=true]")) return;
		let t = e.getRootNode().activeElement;
		t && t !== e && e.contains(t) || e.focus();
	}, [s]), /* @__PURE__ */ (0, H.jsx)(oo, {
		...f,
		children: /* @__PURE__ */ (0, H.jsxs)(W, {
			ref: m,
			className: V("top-1/3 left-1/2 w-[35rem] -translate-x-1/2 translate-y-0 gap-0 overflow-hidden rounded-xl! p-0 shadow-[0_1.5rem_3rem_-1rem_rgb(0_0_0/0.22)] sm:max-w-[35rem]", r),
			container: a,
			onEscapeKeyDown: u,
			onOpenAutoFocus: (e) => {
				e.preventDefault(), p.current?.querySelector("[data-slot=command-input], textarea, input")?.focus();
			},
			showCloseButton: i,
			children: [/* @__PURE__ */ (0, H.jsxs)(G, {
				className: "sr-only",
				children: [/* @__PURE__ */ (0, H.jsx)(lo, { children: e }), /* @__PURE__ */ (0, H.jsx)(uo, { children: t })]
			}), /* @__PURE__ */ (0, H.jsx)(zs, {
				commandRef: p,
				contentDepth: o,
				contentKey: s,
				contentRef: m,
				defaultValue: c,
				filter: l,
				onKeyDown: d,
				title: e,
				children: n
			})]
		})
	});
}
function Vs({ className: e, compact: t = !1, wrapperClassName: n, ...r }) {
	return /* @__PURE__ */ (0, H.jsx)("div", {
		"data-slot": "command-input-wrapper",
		className: V(t ? "min-w-0 flex-1" : "px-1.5 pt-1.5", n),
		children: /* @__PURE__ */ (0, H.jsxs)("label", {
			className: V("flex cursor-text items-center gap-2 bg-muted px-2.5 has-disabled:opacity-50", t ? "h-8 rounded-[0.5rem]" : "h-10 rounded-[0.625rem]"),
			children: [/* @__PURE__ */ (0, H.jsx)(P, {
				"aria-hidden": "true",
				className: "size-4 shrink-0 text-muted-foreground"
			}), /* @__PURE__ */ (0, H.jsx)(es.Input, {
				"data-slot": "command-input",
				className: V("min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed", e),
				...r
			})]
		})
	});
}
function Hs({ children: e, className: t, onScroll: n, ...r }) {
	let i = _.useRef(null), a = _.useRef(null), [o, s] = _.useState("none");
	_.useLayoutEffect(() => {
		let e = i.current, t = a.current;
		if (!e || !t || typeof MutationObserver > "u") return;
		let n = !1, r = () => {
			let r = e.querySelector("[cmdk-item][data-selected=true]");
			if (!r || r.offsetHeight === 0) {
				t.style.opacity = "0", n = !1;
				return;
			}
			let i = n && !Fs(e.ownerDocument.defaultView);
			t.style.transition = i ? `transform ${Ps}ms ${ks}, height ${Ps}ms ${ks}` : "none", t.style.transform = `translateY(${r.offsetTop}px)`, t.style.height = `${r.offsetHeight}px`, t.style.opacity = "1", n = !0;
		};
		r();
		let o = new MutationObserver(r);
		o.observe(e, {
			attributes: !0,
			attributeFilter: ["data-selected"],
			childList: !0,
			subtree: !0
		});
		let s = typeof ResizeObserver > "u" ? null : new ResizeObserver(r), c = e.querySelector("[cmdk-list-sizer]");
		return s && c && s.observe(c), () => {
			o.disconnect(), s?.disconnect();
		};
	}, []);
	let c = _.useCallback(() => {
		let e = i.current;
		if (!e) return s("none");
		s(fs(e));
	}, []);
	return _.useLayoutEffect(() => {
		let e = i.current;
		if (!e || (c(), typeof ResizeObserver > "u")) return;
		let t = new ResizeObserver(c);
		t.observe(e);
		let n = e.querySelector("[cmdk-list-sizer]");
		return n && t.observe(n), () => t.disconnect();
	}, [c]), /* @__PURE__ */ (0, H.jsxs)(es.List, {
		"data-slot": "command-list",
		"data-fade-mask": o,
		"data-glide": "on",
		className: V("scroll-fade no-scrollbar max-h-80 min-h-0 scroll-py-1 overflow-x-hidden overflow-y-auto px-1.5 py-1 outline-none **:[[cmdk-list-sizer]]:relative", t),
		...r,
		ref: i,
		onScroll: (e) => {
			c(), n?.(e);
		},
		children: [/* @__PURE__ */ (0, H.jsx)("div", {
			"aria-hidden": "true",
			className: "pointer-events-none absolute top-0 left-0 w-full rounded-[0.375rem] bg-muted opacity-0",
			"data-slot": "command-highlight",
			ref: a
		}), e]
	});
}
function Us({ className: e, ...t }) {
	return /* @__PURE__ */ (0, H.jsx)(es.Empty, {
		"data-slot": "command-empty",
		className: V("py-6 text-center text-sm text-muted-foreground", e),
		...t
	});
}
function Ws({ className: e, ...t }) {
	return /* @__PURE__ */ (0, H.jsx)(es.Group, {
		"data-slot": "command-group",
		className: V("overflow-x-clip text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:leading-4 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground", e),
		...t
	});
}
function Gs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, H.jsx)(es.Separator, {
		"data-slot": "command-separator",
		className: V("-mx-1.5 my-1 h-px bg-border", e),
		...t
	});
}
function Ks({ className: e, children: t, end: n, external: r = !1, selectedHint: i, ...a }) {
	let o = n === void 0 ? r ? /* @__PURE__ */ (0, H.jsx)(j, {
		"aria-hidden": "true",
		className: "size-3.5! text-ring"
	}) : i ? /* @__PURE__ */ (0, H.jsx)(fo, {
		"aria-hidden": "true",
		className: "opacity-0 transition-opacity duration-100 group-data-selected/command-item:opacity-100",
		children: i
	}) : /* @__PURE__ */ (0, H.jsx)(k, { className: "opacity-0 group-has-data-[slot=command-checkbox]/command-item:hidden group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" }) : n;
	return /* @__PURE__ */ (0, H.jsxs)(es.Item, {
		"data-slot": "command-item",
		className: V("group/command-item relative flex h-8 scroll-my-1 cursor-default items-center gap-2 rounded-[0.375rem] px-2 text-sm text-foreground/80 outline-hidden transition-colors duration-100 select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted in-data-[glide=on]:data-selected:bg-transparent! data-selected:font-medium data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[svg]:text-muted-foreground data-selected:*:[svg]:text-foreground", e),
		...a,
		children: [t, o ? /* @__PURE__ */ (0, H.jsx)("span", {
			className: "ml-auto flex shrink-0 items-center",
			children: o
		}) : null]
	});
}
function qs({ className: e, ...t }) {
	return /* @__PURE__ */ (0, H.jsx)("span", {
		"aria-hidden": "true",
		"data-slot": "command-checkbox",
		className: V("flex size-4 shrink-0 items-center justify-center rounded-[0.25rem] border border-ring bg-background text-primary-foreground group-data-[checked=true]/command-item:border-primary group-data-[checked=true]/command-item:bg-primary dark:bg-input/30 dark:group-data-[checked=true]/command-item:bg-primary", e),
		...t,
		children: /* @__PURE__ */ (0, H.jsx)(k, {
			className: "size-3! text-primary-foreground! opacity-0 group-data-[checked=true]/command-item:animate-check-in group-data-[checked=true]/command-item:opacity-100",
			strokeWidth: 3
		})
	});
}
function Js({ aside: e, backDisabled: t, children: n, divider: r = !0, onBack: i, parent: a, title: o }) {
	return /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsxs)("div", {
		"data-slot": "command-header",
		className: V("flex h-11 shrink-0 items-center gap-1 pl-1.5", n ? "pr-1.5" : e ? "pr-3" : "pr-2"),
		children: [
			/* @__PURE__ */ (0, H.jsx)("button", {
				"aria-label": "Back",
				className: "flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] text-foreground/80 transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
				disabled: t,
				onClick: i,
				onPointerDown: (e) => {
					e.button === 0 && (e.preventDefault(), i());
				},
				type: "button",
				children: /* @__PURE__ */ (0, H.jsx)(re, {
					"aria-hidden": "true",
					className: "size-4"
				})
			}),
			n ?? /* @__PURE__ */ (0, H.jsxs)("p", {
				className: "m-0 flex min-w-0 flex-1 items-center gap-1",
				children: [a ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)("span", {
					className: "shrink-0 text-muted-foreground",
					children: a
				}), /* @__PURE__ */ (0, H.jsx)("span", {
					"aria-hidden": "true",
					className: "text-muted-foreground/40",
					children: "/"
				})] }) : null, /* @__PURE__ */ (0, H.jsx)("span", {
					className: "truncate font-medium",
					children: o
				})]
			}),
			e ? /* @__PURE__ */ (0, H.jsx)("div", {
				className: "flex shrink-0 items-center text-xs leading-4 text-muted-foreground",
				children: e
			}) : null
		]
	}), r === !0 ? /* @__PURE__ */ (0, H.jsx)("div", {
		"aria-hidden": "true",
		className: "h-px shrink-0 bg-border"
	}) : r || null] });
}
// src/components/ui/spinner.tsx
function Ys({ className: e, ...t }) {
	return /* @__PURE__ */ (0, H.jsx)(M, {
		"data-slot": "spinner",
		role: "status",
		"aria-label": "Loading",
		className: V("size-4 animate-spin", e),
		...t
	});
}
// src/lib/caseIds.ts
var Xs = /(?<!\d)\d{11}(?!\d)/g;
function Zs(e) {
	return e.match(Xs) ?? [];
}
function Qs(e) {
	return [...new Set(Zs(e))];
}
var $s = [
	"unfulfillable",
	"feedback",
	"stranded",
	"suppressed",
	"shippingQueue"
], ec = [
	{
		id: "unfulfillable",
		label: "Unfulfillable"
	},
	{
		id: "feedback",
		label: "Seller Feedback"
	},
	{
		id: "stranded",
		label: "Stranded"
	},
	{
		id: "suppressed",
		label: "Suppressed"
	},
	{
		id: "shippingQueue",
		label: "Shipping Queue"
	}
], tc = {
	prepare: "active",
	sections: $s,
	sources: {
		unfulfillable: { status: "pending" },
		feedback: { status: "pending" },
		stranded: { status: "pending" },
		suppressed: { status: "pending" },
		shippingQueue: { status: "pending" }
	},
	workbook: "pending"
};
function nc(e) {
	return $s.includes(e);
}
function rc(e) {
	if (!e || typeof e != "object") return !1;
	let t = e;
	return nc(t.source) ? t.status === "active" || t.status === "complete" || t.status === "error" : !1;
}
function ic(e) {
	return !!(e && typeof e == "object" && e.type === "REPORTS_PROGRESS" && rc(e));
}
function ac(e, t) {
	let n = t.status === "error" ? "error" : t.status === "complete" ? "complete" : "active";
	return {
		...e,
		sources: {
			...e.sources,
			[t.source]: {
				status: n,
				loaded: t.loaded,
				total: t.total,
				phase: t.phase,
				error: t.error
			}
		}
	};
}
function oc(e) {
	return e.sections.every((t) => {
		let n = e.sources[t].status;
		return n === "complete" || n === "error";
	});
}
function sc(e, t) {
	return e.workbook === "complete" ? "complete" : oc(e) && t ? "active" : e.workbook;
}
function cc(e) {
	return e.status === "complete" ? 100 : e.status === "error" ? null : e.source === "unfulfillable" ? fc(e) : e.source === "feedback" ? mc(e) : e.source === "suppressed" ? pc(e) : e.source === "shippingQueue" ? hc(e) : null;
}
function lc(e, t) {
	return Math.min(1, (e ?? 0) / t);
}
function uc(e, t) {
	if (e.status === "complete") return 100;
	let n = e.total ?? 0;
	return e.phase === t ? n <= 0 ? 100 : 80 + Math.round(20 * lc(e.loaded, n)) : n <= 0 ? e.loaded ? 80 : 0 : Math.round(80 * lc(e.loaded, n));
}
function dc(e) {
	if (e.status === "complete") return 100;
	let t = e.total;
	return t == null || t <= 0 ? null : Math.round(100 * lc(e.loaded, t));
}
function fc(e) {
	return uc(e, "removal");
}
function pc(e) {
	return uc(e, "issues");
}
function mc(e) {
	return dc(e);
}
function hc(e) {
	return dc(e);
}
function gc(e, t) {
	return t.status === "pending" ? "Waiting" : t.status === "complete" ? "Done" : t.status === "error" ? t.error ? `Failed: ${t.error}` : "Failed" : e === "unfulfillable" ? t.phase === "removal" ? t.total ? `Removal status ${t.loaded ?? 0} of ${t.total}` : "Checking removal status" : t.total ? `${t.loaded ?? 0} of ${t.total} listings` : t.loaded ? `${t.loaded} listings` : "Loading listings" : e === "feedback" ? t.loaded ? `${t.loaded.toLocaleString("en-US")} entries` : "Loading" : e === "suppressed" ? t.phase === "issues" ? t.total ? `Suppression reasons ${t.loaded ?? 0} of ${t.total}` : "Loading suppression reasons" : t.total == null ? t.loaded ? `${t.loaded} listings` : "Loading listings" : `${t.loaded ?? 0} of ${t.total} listings` : e === "shippingQueue" ? t.phase === "details" ? t.total ? `Shipment details ${t.loaded ?? 0} of ${t.total}` : "Loading shipment details" : t.total == null ? t.loaded ? `${t.loaded} shipments` : "Loading shipments" : `${t.loaded ?? 0} of ${t.total} shipments` : "Loading";
}
// src/lib/dates.ts
var _c = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
function vc(e) {
	return String(e).padStart(2, "0");
}
function yc(e) {
	return `${vc(e.getDate())}-${_c[e.getMonth()]}-${e.getFullYear()}`;
}
function bc(e) {
	return `${`${vc(e.getUTCDate())}-${_c[e.getUTCMonth()]}-${e.getUTCFullYear()}`} ${vc(e.getUTCHours())}:${vc(e.getUTCMinutes())}:${vc(e.getUTCSeconds())}`;
}
// src/lib/log.ts
var xc = "LOG_ENTRIES", Sc = "[S4E]", Cc = 300, wc = 600, Tc = 4e3, Ec = 400, Dc = 25, Oc = null, kc = !(typeof process < "u" && process.env?.VITEST);
function Ac(e) {
	Oc = e;
}
function jc() {
	return typeof performance < "u" && typeof performance.now == "function" ? performance.now() : Date.now();
}
function Mc(e, t = Cc) {
	let n = e.replace(/otpauth:\/\/[^\s"'<>]+/giu, "[REDACTED]");
	return n.length > t ? `${n.slice(0, t - 1)}…` : n;
}
function Nc(e, t = /* @__PURE__ */ new WeakSet(), n = 0) {
	return typeof e == "string" ? e.replace(/otpauth:\/\/[^\s"'<>]+/giu, "[REDACTED]") : !e || typeof e != "object" ? e : t.has(e) || n >= 8 ? "[OMITTED]" : (t.add(e), Array.isArray(e) ? e.map((e) => Nc(e, t, n + 1)) : Object.fromEntries(Object.entries(e).map(([e, r]) => [e, /password|passphrase|secret|otpauth|authorization|cookie|accesstoken|refreshtoken|apikey|privatekey|^(otp|otpcode)$/iu.test(e.replace(/[^a-z]/giu, "")) ? "[REDACTED]" : Nc(r, t, n + 1)])));
}
function Pc(e, t = "Unknown error.") {
	return e instanceof Error && e.message ? e.message : typeof e == "string" && e ? e : t;
}
function Fc(e) {
	if (!(e instanceof Error)) return { message: Mc(Pc(e)) };
	let t = {
		name: e.name,
		message: Mc(Pc(e))
	};
	return e.stack && (t.stack = Mc(e.stack, wc)), t;
}
function Ic(e) {
	let t = zc(e);
	if (t) {
		if (e = t, kc) {
			let t = e.level === "error" ? console.error : e.level === "warn" ? console.warn : console.info, n = e.ms === void 0 ? "" : ` ${e.ms}ms`, r = e.run ? ` [${e.run}]` : "";
			t(`${Sc} ${e.ctx} · ${e.event}${n}${r}`, ...e.data ? [e.data] : []);
		}
		try {
			Oc?.(e);
		} catch {}
	}
}
function Lc(e, t) {
	let n = (n, r, i, a) => {
		let o = {
			t: Date.now(),
			level: n,
			ctx: e,
			event: r
		};
		t && (o.run = t), a !== void 0 && (o.ms = a), i && Object.keys(i).length > 0 && (o.data = i), Ic(o);
	};
	return {
		info: (e, t) => n("info", e, t),
		warn: (e, t) => n("warn", e, t),
		error: (e, t) => n("error", e, t),
		time: (e, t) => {
			let r = jc();
			return (i, a = "info") => {
				let o = Math.round(jc() - r);
				return n(a, e, t || i ? {
					...t,
					...i
				} : void 0, o), o;
			};
		},
		withRun: (t) => Lc(e, t)
	};
}
function Rc() {
	let e = [], t, n = () => {
		t !== void 0 && clearTimeout(t), t = void 0;
		let n = e;
		if (e = [], n.length !== 0 && typeof chrome < "u" && chrome.runtime?.id) try {
			chrome.runtime.sendMessage({
				type: xc,
				entries: n
			}).catch(() => void 0);
		} catch {}
	};
	return (r) => {
		e.push(r), e.length >= Dc ? n() : t ??= setTimeout(n, Ec);
	};
}
function zc(e) {
	if (!e || typeof e != "object") return;
	let t = e;
	if (typeof t.t != "number" || ![
		"info",
		"warn",
		"error"
	].includes(t.level) || typeof t.ctx != "string" || typeof t.event != "string") return;
	let n = {
		t: t.t,
		level: t.level,
		ctx: Mc(t.ctx, 40),
		event: Mc(t.event, 120)
	};
	if (typeof t.run == "string" && (n.run = Mc(t.run, 60)), typeof t.tab == "number" && Number.isInteger(t.tab) && t.tab >= 0 && (n.tab = t.tab), typeof t.ms == "number" && Number.isFinite(t.ms) && (n.ms = t.ms), t.data && typeof t.data == "object") {
		let e = "";
		try {
			e = JSON.stringify(Nc(t.data));
		} catch {
			e = "";
		}
		n.data = e.length <= Tc ? JSON.parse(e || "{}") : {
			truncated: !0,
			preview: Mc(e, Cc)
		};
	}
	return n;
}
var Bc = `Only ${2e4.toLocaleString("en-US")} feedback entries were loaded. Seller Central has more.`, Vc = [
	"Date",
	"Rating",
	"Sentiment",
	"Order ID",
	"Feedback",
	"Item as described",
	"Seller response",
	"Response date",
	"Suppressed",
	"Partially suppressed",
	"Suppress reason",
	"Feedback ID"
], Hc = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	nbsp: " "
};
function Uc(e) {
	return typeof e == "number" && Number.isInteger(e) && e >= 1 && e <= 3;
}
function Wc(e) {
	return Uc(e) ? e <= 2 ? "Negative" : "Neutral" : "";
}
function Gc(e) {
	return e.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (e, t) => {
		if (t.startsWith("#x") || t.startsWith("#X")) {
			let n = Number.parseInt(t.slice(2), 16);
			return Number.isFinite(n) ? String.fromCodePoint(n) : e;
		}
		if (t.startsWith("#")) {
			let n = Number.parseInt(t.slice(1), 10);
			return Number.isFinite(n) ? String.fromCodePoint(n) : e;
		}
		return Hc[t] ?? e;
	});
}
function Kc(e) {
	if (!e) return "";
	let t = new Date(e);
	return Number.isNaN(t.getTime()) ? e : bc(t);
}
function qc(e) {
	return e == null ? "" : String(e);
}
function Jc(e) {
	return e === !0 ? "Yes" : e === !1 ? "No" : "";
}
function Yc(e) {
	return Jc(e.answerMap?.ItemAsDescribed?.booleanRating);
}
function Xc(e) {
	let t = typeof e.numericRating == "number" && Number.isFinite(e.numericRating) ? e.numericRating : "";
	return [
		Kc(e.feedbackDate),
		t,
		Wc(typeof t == "number" ? t : void 0),
		qc(e.orderId),
		Gc(e.feedbackText ?? ""),
		Yc(e),
		Gc(e.responseText ?? ""),
		Kc(e.responseDate),
		Jc(e.suppressed),
		Jc(e.partiallySuppressed),
		qc(e.suppressReasonId),
		qc(e.feedbackId)
	];
}
function Zc(e) {
	return [[...Vc], ...e.map(Xc)];
}
// src/lib/dailyTasks.ts
var Qc = [
	"Feedback Manager",
	"Disposal Orders",
	"Open Cases"
];
function $c(e = []) {
	let t = e.some((e) => e.feedbackIncomplete);
	return [
		[Qc[0]],
		...t ? [[Bc]] : [],
		...Zc(e),
		[],
		[Qc[1]],
		[],
		[Qc[2]]
	];
}
// src/lib/shippingQueue.ts
var el = "https://sellercentral.amazon.com/fba/wmsr", tl = "Shipment ID - Outside Reconciliation Window", nl = "Shipment ID - For Monitoring (Automatically Closed After 90 Days)", rl = "Shipment ID - Investigation Completed - Contents Counted and Confirmed", il = "Shipment ID - Units Located - No Further Action Required", al = "Received in Full - No Discrepancies Found", ol = "Shipment ID - New (Send List)", sl = "Shipment ID - Overaged", cl = "Review Needed", ll = "Proof of Inventory Ownership", ul = "Delivery", dl = "Loaded", fl = "Couldn’t load shipment details", pl = "Some shipments could not be loaded. This sheet includes only the shipments that were obtainable.", ml = "Shipment details could not be loaded for some shipments. Those rows are marked “Couldn’t load shipment details”.", hl = "Some shipments’ SKU lines couldn’t all be loaded. Those shipments list only the SKU lines that were obtainable.", gl = /* @__PURE__ */ "Shipment Name.Shipment ID.Shipment URL.Status.Destination FC.FC Country.Ship From Address ID.Created Date.Last Updated Date.MSKUs.Shipped Quantity.Received Quantity.Expected Quantity.Located Quantity.Stowed Quantity.Quantity Discrepancy.Workflow ID.Workflow Type.PO ID.Placement Status.Window Type.Window Start Date.Window End Date.Grace Period End Date.Window Compliance Status.Need By Date.Reason Code.Finalized.Finalized Date.Estimated Finalized Date UTC.Former Estimated Finalized Date UTC.Blocked.Partnered Import.Merchant Launched.ISMS Details.T2P Accelerate".split("."), _l = [
	"Details Status",
	"Claim Page URL",
	"Reimbursement Eligible",
	"Ineligibility Reason",
	"Estimated Eligibility Date",
	"Former Estimated Eligibility Date",
	"Days To Wait",
	"Eligibility Details",
	"Inquiry Status",
	"Inquiry Text",
	"Inquiry Case ID",
	"Inquiry Case Created Date",
	"Inquiry Case Created By",
	"Has Discrepancy",
	"Retail Domain",
	"Claims Allowed",
	"SKU Lines",
	"Total Discrepancy Quantity"
], vl = /* @__PURE__ */ "SKU.Title.FNSKU.ASIN.ASIN URL.UPC.Barcode Type.Barcode Value.Condition.Sortable.Eligible For Research.Item Expected Quantity.Item Located Quantity.Item Received Quantity.Adjustment Quantity.Reimbursed Quantity.Clawback Quantity.Acknowledged Quantity.Denied Quantity.Virtually Adjusted Quantity.Other Received Quantity.Other Receive Start Date.Other Receive End Date.IAR Auto Reconciliations.Item Discrepancy Quantity.Item Ineligibility Reason.Item Case ID.Item Reason Code".split("."), yl = [
	...gl,
	..._l,
	...vl
];
function bl(e) {
	if (e == null || e === "") return "";
	let t = typeof e == "number" ? e : Number(e), n = Number.isFinite(t) ? new Date(t) : new Date(String(e));
	return Number.isNaN(n.getTime()) ? String(e) : bc(n);
}
function xl(e) {
	return e === 0 || e === "0" ? "" : bl(e);
}
function K(e) {
	return e == null ? "" : String(e);
}
function Sl(e) {
	if (e == null || e === "") return "";
	let t = typeof e == "number" ? e : Number(e);
	return Number.isFinite(t) ? t : "";
}
function Cl(e) {
	return e === !0 ? "Yes" : e === !1 ? "No" : "";
}
function wl(e, t) {
	let n = Sl(e), r = Sl(t);
	return n === "" || r === "" ? "" : n - r;
}
function Tl(e) {
	let t = e?.trim();
	return t ? `https://sellercentral.amazon.com/fba/inbound-shipment/summary/${encodeURIComponent(t)}/contents` : "";
}
function El(e) {
	let t = e?.trim();
	return t ? `${el}/${encodeURIComponent(t)}` : "";
}
function Dl(e) {
	let t = e?.trim();
	return t ? `https://www.amazon.com/dp/${encodeURIComponent(t)}` : "";
}
function Ol(e) {
	if (e == null) return "";
	if (typeof e == "boolean") return Cl(e);
	if (typeof e == "object") try {
		return JSON.stringify(e);
	} catch {
		return String(e);
	}
	return String(e);
}
function kl(e) {
	return e ? Object.entries(e).map(([e, t]) => `${e}: ${Ol(t)}`).join("; ") : "";
}
function Al(e) {
	let t = e?.discrepancyTotalRecords;
	return typeof t == "number" && t > (e?.items.length ?? 0);
}
function jl(e) {
	let t = 0, n = !1;
	for (let r of e.items) typeof r.totalDiscrepancyQuantity == "number" && (t += r.totalDiscrepancyQuantity, n = !0);
	return n ? t : "";
}
var Ml = _l.map(() => ""), Nl = vl.map(() => "");
function Pl(e) {
	let t = e.shipOrDeliveryWindow;
	return [
		K(e.shipmentName),
		K(e.shipmentId),
		Tl(e.shipmentId),
		K(e.shipmentStatus),
		K(e.destinationFC),
		K(e.fcAddress),
		K(e.shipFromAddressId),
		bl(e.createdDate),
		bl(e.lastUpdatedDate),
		Sl(e.mskus),
		Sl(e.shippedQuantity),
		Sl(e.receivedQuantity),
		Sl(e.expectedQuantity),
		Sl(e.locatedQuantity),
		Sl(e.stowedQuantity),
		wl(e.receivedQuantity, e.shippedQuantity),
		K(e.workflowId),
		K(e.workflowType),
		K(e.poId),
		K(e.placementStatus),
		K(t?.windowType),
		bl(t?.windowStartDate),
		bl(t?.windowEndDate),
		bl(t?.gracePeriodEndDate),
		K(e.shipOrDeliveryWindowComplianceStatus),
		bl(e.needByDate),
		K(e.reasonCode),
		Cl(e.finalized),
		bl(e.finalizedDate),
		bl(e.estimatedFinalizedDateUTC),
		bl(e.formerEstimatedFinalizedDateUTC),
		Cl(e.blocked),
		Cl(e.partneredImport),
		Cl(e.merchantLaunched),
		Ol(e.ismsDetails),
		Ol(e.t2pAccelerate)
	];
}
function Fl(e) {
	let t = e.details;
	if (!t) return [e.detailsFetchFailed ? fl : "", ...Ml.slice(1)];
	let n = t.inquiry;
	return [
		dl,
		El(e.shipmentId),
		Cl(t.eligible),
		K(t.ineligibilityReason),
		xl(t.estimatedTimestamp),
		xl(t.formerEstimatedTimestamp),
		Sl(t.daysToWait),
		kl(t.details),
		K(n?.inquiryStatus),
		K(n?.inquiryText),
		K(n?.caseId),
		bl(n?.caseCreationDate),
		K(n?.caseCreatedBy),
		Cl(t.hasDiscrepancy),
		K(t.retailDomainName),
		Cl(t.wmsrAllowed),
		Sl(t.discrepancyTotalRecords ?? t.items.length),
		jl(t)
	];
}
function Il(e) {
	return e ? [
		K(e.merchantSKU),
		K(e.title),
		K(e.fnsku),
		K(e.asin),
		Dl(e.asin),
		K(e.upc),
		K(e.barcodeType),
		K(e.barcodeValue),
		K(e.itemCondition),
		Cl(e.isSortable),
		Cl(e.eligibleForResearch),
		Sl(e.expectedQuantity),
		Sl(e.totalLocatedQuantity),
		Sl(e.totalReceivedQuantity),
		Sl(e.totalAdjustmentQuantity),
		Sl(e.totalReimbursedQuantity),
		Sl(e.totalClawbackQuantity),
		Sl(e.totalAcknowledgedQuantity),
		Sl(e.totalDeniedQuantity),
		Sl(e.totalVirtuallyAdjustedQuantity),
		Sl(e.otherReceivedQuantity),
		bl(e.otherReceiveStartDate),
		bl(e.otherReceiveEndDate),
		Ol(e.iarAutoReconciliations),
		Sl(e.totalDiscrepancyQuantity),
		K(e.ineligibilityReason),
		K(e.caseId),
		K(e.reasonCode)
	] : [...Nl];
}
function Ll(e, t) {
	return [
		...Pl(e),
		...Fl(e),
		...Il(t)
	];
}
function q(e) {
	let t = e.details?.items ?? [];
	return t.length === 0 ? [Ll(e)] : t.map((t) => Ll(e, t));
}
function Rl(e) {
	return [...e].reverse();
}
function J(e) {
	let t = [];
	return e.some((e) => e.listingsIncomplete) && t.push([pl]), e.some((e) => e.detailsFetchFailed) && t.push([ml]), e.some((e) => Al(e.details)) && t.push([hl]), t.length && t.push([]), t;
}
function Y(e) {
	return [
		...J(e),
		[...yl],
		...Rl(e).flatMap(q)
	];
}
function X(e) {
	if (e.detailsFailed) return "N/A";
	let t = e.shipmentIneligibilityReason ?? "", n = e.itemIneligibilityReason ?? "", r = e.discrepancy;
	if (t === "NINE_MONTH_STATUTE_OF_LIMITATIONS") return tl;
	if (t === "NOT_ALL_SHIPPED") return nl;
	if (n === "ITEM_LEVEL_AUTHORITATIVE_RECEIVE") return rl;
	if (n === "RESEARCHED") return il;
	if (r === 0) return al;
	if (e.eligible === !0) {
		if (typeof r == "number" && r < 0) return ol;
		if (typeof r == "number" && r > 0) return sl;
	}
	return t && t !== "NONE" ? t : cl;
}
function zl(e, t) {
	if (t !== "Shipment ID - New (Send List)") return "N/A";
	let n = [];
	return e?.includes("INVOICE") && n.push(ll), e?.includes("POD") && n.push(ul), n.length > 0 ? n.join(" AND ") : "N/A";
}
// src/lib/stranded.ts
var Bl = "America/New_York", Vl = [
	"SKU",
	"Condition",
	"Product Name",
	"ASIN",
	"FNSKU",
	"Status",
	"Status secondary",
	"Price",
	"Currency",
	"Available",
	"Total",
	"Reserved",
	"Inbound",
	"Unfulfillable",
	"Auto removal date",
	"Auto removal type",
	"Date stranded",
	"Stranded reason",
	"Stranded reason code",
	"Error message",
	"Fulfilled by",
	"Program",
	"Actions"
], Hl = { RETURN: "Return to seller" };
function Ul(e) {
	return e == null ? "" : String(e);
}
function Wl(e) {
	if (e == null || e === "") return "";
	let t = typeof e == "number" ? e : Number(e);
	return Number.isFinite(t) ? t : "";
}
function Gl(e) {
	let t = Wl(e);
	return t === "" ? 0 : t;
}
function Kl(e) {
	if (!e) return "";
	let t = Number(e);
	if (!Number.isFinite(t)) return e;
	let n = new Date(t);
	return Number.isNaN(n.getTime()) ? e : new Intl.DateTimeFormat("en-US", {
		timeZone: Bl,
		month: "2-digit",
		day: "2-digit",
		year: "numeric"
	}).format(n);
}
function ql(e) {
	return e ? Hl[e] ?? e : "";
}
function Jl(e) {
	return e ? e.split("#").map((e) => e.trim()).filter(Boolean).join(", ") : "";
}
function Yl(e) {
	return [
		Ul(e.SKU),
		Ul(e.Condition),
		Ul(e.ProductName),
		Ul(e.ASIN),
		Ul(e.FNSKU),
		Ul(e.Status),
		Ul(e.StatusSecondary),
		Wl(e.Price),
		Ul(e.PriceUnit),
		Gl(e.Available),
		Gl(e.TotalQuantity),
		Gl(e.Reserved),
		Gl(e.Inbound),
		Gl(e.Unfulfillable),
		Kl(e.DateAutoRemoval),
		ql(e.AutoRemovalType),
		Kl(e.DateStranded),
		Ul(e.StrandedReasonLabel || e.ErrorMessage || e.StrandedReasonCode || e.StrandedReason),
		Ul(e.StrandedReasonCode || e.StrandedReason),
		Ul(e.ErrorMessage),
		Ul(e.FulfilledBy),
		Ul(e.Program),
		Jl(e.SupportedActions)
	];
}
function Xl(e) {
	return [[...Vl], ...e.map(Yl)];
}
`${new URLSearchParams([
	["type", "RemovalOrderDetail"],
	["size", "50"],
	["offset", "0"],
	["sDate", ""],
	["eDate", ""],
	["days", "30"],
	["sDateOff", "0"],
	["eDateOff", "0"],
	...[
		"completed_qty",
		"order_status",
		"msku",
		"fnsku",
		"in_process_qty",
		"cancelled_qty",
		"request_qty",
		"amazon_order_id",
		"order_source",
		"creation_date",
		"order_type",
		"removal_order_id"
	].map((e) => ["cols", e]),
	["sort", JSON.stringify({
		keyName: "creation_date",
		sortingOrder: "DESC"
	})]
])}`;
var Zl = [
	"SKU",
	"ASIN",
	"FNSKU",
	"Title",
	"Status",
	"Price",
	"Currency",
	"Unfulfillable",
	"Carrier Damaged",
	"Customer Damaged",
	"Defective",
	"Expired",
	"Warehouse Damaged",
	"Distributor Damaged",
	"Removal Status",
	"Last Updated",
	"Image URL"
], Ql = "Total available for removal", $l = "unknown ineligible reason", eu = "Couldn’t load removal status", tu = "Some unfulfillable listings could not be loaded. This sheet includes only the listings that were obtainable.", nu = `Removal status could not be loaded for some SKUs. Those rows are marked “${eu}”.`, ru = {
	InventoryInPendingRequest: "Inventory already scheduled for removal - no further action required",
	InventoryIsBound: "Inventory temporarily unavailable for removal as a result of an in-progress transaction or other process – please check again in a few days.",
	InventoryIsWarehouseDamaged: "Inventory damaged in the fulfillment center - no action required",
	InventoryIsAllocated: "Inventory is being processed (for order, customer return, or recall) - please try again in a few days",
	InventoryUnavailable: "Inventory Unavailable",
	InventoryIsInBoundProcessing: "Inventory is not available for removal; please try again in two days or contact Seller Support.",
	InventoryIsDcTransfer: "Inventory is not available for removal; please try again in two days or contact Seller Support.",
	InventoryInUnsupportedFc: "Inventory in location that cannot process removals - please contact us",
	InventoryInUnsupportedBzFc: "Inventory in a Bonded Zone location that cannot process removals - please contact us",
	InventoryInPickupRemovalUnsupportedFc: "Inventory in location that cannot process pickup removals - please process these units through other available channels",
	InventoryIsHazmatItem: "Inventory is classified as Hazardous Material (Hazmat) - please contact us",
	InventorySubjectToLendingRestriction: "Inventory cannot be removed due to Lending restrictions - please contact Amazon Lending"
}, iu = [
	Ql,
	ru.InventoryInPendingRequest,
	ru.InventoryIsBound,
	ru.InventoryIsWarehouseDamaged,
	ru.InventoryIsAllocated,
	ru.InventoryUnavailable,
	ru.InventoryIsInBoundProcessing,
	ru.InventoryInUnsupportedFc,
	ru.InventoryInUnsupportedBzFc,
	ru.InventoryInPickupRemovalUnsupportedFc,
	ru.InventoryIsHazmatItem,
	ru.InventorySubjectToLendingRestriction,
	$l
];
function au(e) {
	return e ? e.split(/[_-]+/).filter(Boolean).map((e) => e.charAt(0).toUpperCase() + e.slice(1).toLowerCase()).join(" ") : "";
}
function ou(e) {
	return e == null ? "" : String(e);
}
function su(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : 0;
}
function cu(e) {
	for (let t of e.offers ?? []) {
		let e = t?.price?.price;
		if (!e?.amount) continue;
		let n = Number(e.amount);
		if (Number.isFinite(n)) return {
			amount: n,
			currency: e.currencyUnit ?? ""
		};
	}
	return {
		amount: "",
		currency: ""
	};
}
function lu(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e ?? []) n.quantity <= 0 || t.set(n.label, (t.get(n.label) ?? 0) + n.quantity);
	let n = iu.filter((e) => t.has(e)).map((e) => ({
		label: e,
		quantity: t.get(e) ?? 0
	})), r = new Set(iu);
	for (let [e, i] of t) r.has(e) || n.push({
		label: e,
		quantity: i
	});
	return n.map(({ label: e, quantity: t }) => `${e} - ${t} ${t === 1 ? "unit" : "units"}`).join(" || ");
}
function uu(e) {
	let t = e.availability?.unfulfillableDetails, n = cu(e);
	return [
		ou(e.coreListingFields?.sku),
		ou(e.coreListingFields?.asin),
		ou(e.coreListingFields?.fnSku),
		ou(e.listingData?.title),
		au(e.status?.status),
		n.amount,
		n.currency,
		su(e.availability?.unfulfillable),
		su(t?.damagedByCarrier),
		su(t?.damagedByCustomer),
		su(t?.defective),
		su(t?.expired),
		su(t?.damagedByWarehouse),
		su(t?.damagedByDistributor),
		e.removalFetchFailed ? eu : lu(e.removal),
		ou(e.listingData?.lastUpdated),
		ou(e.imageUrl)
	];
}
function du(e) {
	let t = [];
	return e.some((e) => e.listingsIncomplete) && t.push([tu]), e.some((e) => e.removalFetchFailed) && t.push([nu]), t.length && t.push([]), t;
}
function fu(e) {
	return [
		...du(e),
		[...Zl],
		...e.map(uu)
	];
}
// src/lib/suppressed.ts
var pu = "Some search-suppressed listings could not be loaded. This sheet includes only the listings that were obtainable.", mu = "Suppression reasons could not be loaded for some SKUs. Those rows are marked “Couldn’t load suppression reason”.", hu = "Couldn’t load suppression reason", gu = /* @__PURE__ */ "SKU.ASIN.FNSKU.Title.Title differentiation.Image URL.Detail page URL.SKU Central link.Status.Status text.Highlighted state.Inline action.Inline action text.Fix listing URL.Issue.Issue type.Issue attribute.Enforcement.Issue source.Issue tags.Product type.Listing type.Bundle status.Fulfillment channel.Condition.Sub-condition.Parent ASIN.Parent SKU.Children.Is parent.Is customizable.Marketplace count.External IDs.Favorite.Tags.Shipping template.Shipping template ID.Legacy template.Date created.Last updated.Last 30 day GMS.Last 30 day GV.Last 30 day units sold.Quality grade.Quality grade updated.Available.Infinite quantity.Inventory availability.On hand.Inbound.Reserved.Reserved FC transfer.Reserved customer order.Reserved FC processing.Buyable in transit.Pending customer orders in transit.Unfulfillable.Carrier damaged.Customer damaged.Defective.Expired.Warehouse damaged.Distributor damaged.Researching short term.Researching mid term.Researching long term.FBA recommendation.Fulfillment markets.AA availabilities.Inventory alert.Days of supply.Recommended inventory.Price.Currency.Sale price.Min allowed price.Max allowed price.Business price.Quantity discount.Max retail price.Estimated shipping.Points.Automated pricing.Tax rate.Tax exclusive price.Tax exclusive business price.Lowest price.Lowest shipping.Buy box price.Buy box shipping.Sales rank.Sales rank category.Competitive benchmark price.Competitive benchmark shipping.Business program.Haul offer.FFO offer.Non-ALL offer.Actions.Points Central link".split(".");
function Z(e) {
	return e == null ? "" : String(e);
}
function _u(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : 0;
}
function vu(e) {
	if (typeof e == "number" && Number.isFinite(e)) return e;
	if (typeof e == "string" && e.trim()) {
		let t = Number(e);
		if (Number.isFinite(t)) return t;
	}
	return "";
}
function yu(e) {
	return e == null ? "" : e ? "Yes" : "No";
}
function bu(e) {
	return vu(e?.amount);
}
function xu(e) {
	return e.map((e) => e == null ? "" : String(e).trim()).filter(Boolean).join(" | ");
}
function Su(e) {
	return (e ?? []).filter((e) => !!e).map((e) => `${e.key ?? ""}=${e.value ?? ""}`).filter((e) => e !== "=").join(", ");
}
function Cu(e, t = "") {
	return (e ?? []).filter((e) => !!e).map((e) => `${Z(e.quantity)}${t}:${Z(e.amount)}`).filter((e) => e !== `${t}:` && e !== ":");
}
function wu(e) {
	return e ? [...Cu(e.percentQuantityPrice, "%"), ...Cu(e.fixedQuantityPrice)].join(", ") : "";
}
function Tu(e) {
	return e ? xu([
		e.type,
		(e.tags ?? []).filter(Boolean).join(", "),
		(e.attributes ?? []).filter(Boolean).join(", "),
		Su(e.parameters),
		(e.enforcementActions ?? []).filter(Boolean).join(", ")
	]) : "";
}
function Eu(e) {
	return (e.availability?.availabilities ?? []).filter((e) => !!e).map((e) => `${Z(e.fmid)}:${_u(e.quantity)}:${Z(e.fulfillmentChannelName)}`).filter(Boolean).join(" | ");
}
function Du(e) {
	return (e.availability?.aaAvailabilities ?? []).filter((e) => !!e).map((e) => xu([
		e.fulfillmentChannelName,
		_u(e.quantity),
		e.isAggregatedAvailability ? "aggregated" : ""
	])).filter(Boolean).join(" | ");
}
function Ou(e) {
	let t = e.availability?.inventoryAlert;
	return t ? xu([
		t.alertType,
		t.threshold == null ? "" : `threshold=${t.threshold}`,
		t.isThresholdReached == null ? "" : `reached=${yu(t.isThresholdReached)}`
	]) : "";
}
function ku(e, t) {
	if (!e) return "";
	let n = bu(t);
	return xu([
		e.label,
		e.state,
		n === "" ? "" : n
	]);
}
function Au(e) {
	let t = 0, n = (e) => {
		e != null && e !== "" && (t += 1);
	};
	return n(e.price?.price?.amount), n(e.businessPrice), n(e.quantityDiscount), n(e.salePrice?.price?.amount), n(e.minAllowedPrice?.price?.amount), n(e.maxAllowedPrice?.price?.amount), n(e.automatedPricing), n(e.maxRetailPrice?.price?.amount), n(e.haulOffer), n(e.ffoOffer), n(e.nonAllOffer), n(e.points), n(e.condition?.condition), t;
}
function ju(e) {
	let t = (e.offers ?? []).filter((e) => !!e);
	if (t.length !== 0) return t.reduce((e, t) => Au(t) > Au(e) ? t : e);
}
function Mu(e) {
	let t = ju(e), n = e.availability?.unfulfillableDetails, r = e.pricing?.competitionState, i = e.pricing?.competitivePricingSummary?.competitiveBenchmarkPrice, a = bu(t?.price?.price);
	return [
		Z(e.coreListingFields?.sku ?? e.listingData?.sku),
		Z(e.coreListingFields?.asin ?? e.listingData?.asin),
		Z(e.coreListingFields?.fnSku ?? e.listingData?.fnSku),
		Z(e.listingData?.title),
		Z(e.listingData?.titleDifferentiation),
		Z(e.imageUrl),
		Z(e.detailPageUrl),
		Z(e.skuCentralLink),
		au(e.status?.status),
		Z(e.status?.statusText),
		Z(e.status?.highlightedState),
		Z(e.status?.inlineAction),
		Z(e.status?.inlineActionText),
		Z(e.status?.redirectionLink),
		...Iu(e),
		Z(e.listingData?.productType),
		Z(e.listingData?.listingType),
		Z(e.listingData?.bundleStatus),
		Z(e.coreListingFields?.fulfillmentChannel ?? t?.fulfillmentChannel),
		Z(t?.condition?.condition),
		Z(t?.condition?.subCondition),
		Z(e.listingData?.parentAsin),
		Z(e.listingData?.parentSku),
		_u(e.listingData?.numberOfChildren),
		yu(e.isParentListing),
		yu(e.isCustomizable),
		_u(e.marketplaceCount),
		(e.listingData?.externalIds ?? []).filter((e) => !!e).map((e) => `${Z(e.type)}:${Z(e.value)}`).filter((e) => e !== ":").join(", "),
		yu(e.annotations?.favorite),
		(e.annotations?.tagsAnnotation ?? []).map((e) => e?.value).filter((e) => !!e).join(", "),
		Z(e.shippingTemplate?.TemplateName),
		Z(e.shippingTemplate?.TemplateId),
		yu(e.shippingTemplate?.Legacy),
		Z(e.listingData?.dateCreated),
		Z(e.listingData?.lastUpdated),
		vu(e.listingData?.last30DayGms),
		vu(e.listingData?.last30DayGv),
		vu(e.listingData?.last30DayUnitsSold),
		Z(e.listingData?.qualityRecommendationScore?.grade),
		Z(e.listingData?.qualityRecommendationScore?.lastUpdatedDate),
		_u(e.availability?.quantity),
		yu(e.availability?.isQuantityInfinite),
		Z(e.availability?.inventoryAvailability),
		_u(e.availability?.onHandQuantity),
		_u(e.availability?.inbound),
		_u(e.availability?.reservedQuantity),
		_u(e.availability?.reserved?.fcTransfer),
		_u(e.availability?.reserved?.customerOrder),
		_u(e.availability?.reserved?.fcProcessing),
		_u(e.availability?.buyableInTransit),
		_u(e.availability?.pendingCustomerOrdersInTransit),
		_u(e.availability?.unfulfillable),
		_u(n?.damagedByCarrier),
		_u(n?.damagedByCustomer),
		_u(n?.defective),
		_u(n?.expired),
		_u(n?.damagedByWarehouse),
		_u(n?.damagedByDistributor),
		_u(e.availability?.researching?.shortTerm),
		_u(e.availability?.researching?.midTerm),
		_u(e.availability?.researching?.longTerm),
		Tu(e.availability?.fbaRecommendation),
		Eu(e),
		Du(e),
		Ou(e),
		vu(e.availability?.recommendation?.daysOfSupply),
		vu(e.availability?.recommendation?.recommendedInventory),
		a,
		Z(t?.price?.price?.currencyUnit),
		bu(t?.salePrice?.price),
		bu(t?.minAllowedPrice?.price),
		bu(t?.maxAllowedPrice?.price),
		bu(t?.businessPrice?.price),
		wu(t?.quantityDiscount ?? t?.businessPrice),
		bu(t?.maxRetailPrice?.price),
		bu(e.estimatedShipping),
		Z(t?.points ?? e.pricing?.points),
		Z(t?.automatedPricing?.enrollmentStatus ?? e.pricing?.automatedPricing?.enrollmentStatus),
		vu(e.pricing?.taxData?.taxRate),
		vu(e.pricing?.taxData?.taxExclusivePrice),
		vu(e.pricing?.taxData?.taxExclusiveBusinessPrice),
		bu(r?.lowestPrice?.price),
		bu(r?.lowestPrice?.shipping),
		bu(r?.buyBoxPrice?.price),
		bu(r?.buyBoxPrice?.shipping),
		vu(r?.salesRank?.rank),
		Z(r?.salesRank?.productCategory),
		bu(i?.price),
		bu(i?.shipping),
		Z(t?.businessProgram?.valueLabel ?? t?.businessProgram?.value),
		ku(t?.haulOffer, t?.haulOffer?.haulPrice?.price),
		ku(t?.ffoOffer, t?.ffoOffer?.ffoPrice?.price),
		ku(t?.nonAllOffer, t?.nonAllOffer?.nonAllPrice?.price),
		(e.actions ?? []).map((e) => e?.type).filter((e) => !!e).join(", "),
		Z(e.pointsCentralLink)
	];
}
function Nu(e, t) {
	for (let n of e.parameters ?? []) if (n?.key === t && n.value) return n.value;
	return "";
}
function Pu(e) {
	let t = Nu(e, "v3_flat_attribute_name") || Nu(e, "attribute_name");
	if (t) return t.replace(/^\[|\]$/g, "");
	for (let t of e.issuePathForwards ?? []) for (let e of t?.attributes ?? []) if (e?.v3FlatPath) return e.v3FlatPath;
	return "";
}
function Fu(e) {
	let t = (e ?? []).filter((e) => !!e), n = (e) => e.map((e) => e?.trim() ?? "").filter(Boolean).join(" || "), r = /* @__PURE__ */ new Set();
	for (let e of t) for (let t of e.tags ?? []) t && r.add(t);
	return {
		message: n(t.map((e) => e.localizedIssueMessage)),
		type: n(t.map((e) => e.type)),
		attribute: n(t.map(Pu)),
		enforcement: n(t.map((e) => (e.enforcementActions ?? []).filter(Boolean).join(", "))),
		source: n(t.map((e) => e.issueSource)),
		tags: [...r].join(", ")
	};
}
function Iu(e) {
	if (e.issuesFetchFailed) return [
		hu,
		"",
		"",
		"",
		"",
		""
	];
	let t = Fu(e.issues);
	return [
		t.message,
		t.type,
		t.attribute,
		t.enforcement,
		t.source,
		t.tags
	];
}
function Lu(e) {
	if (e.availability?.isQuantityInfinite) return !0;
	let t = e.availability?.quantity;
	return typeof t == "number" && Number.isFinite(t) && t !== 0;
}
function Ru(e) {
	return e.filter(Lu);
}
function zu(e) {
	let t = [];
	return e.some((e) => e.listingsIncomplete) && t.push([pu]), e.some((e) => e.issuesFetchFailed) && t.push([mu]), t.length && t.push([]), t;
}
function Bu(e) {
	let t = Ru(e);
	return [
		...zu(e),
		[...gu],
		...t.map(Mu)
	];
}
// src/lib/xlsxWorkbook.ts
var Vu = /* @__PURE__ */ new Uint32Array(256);
for (let e = 0; e < 256; e += 1) {
	let t = e;
	for (let e = 0; e < 8; e += 1) t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
	Vu[e] = t >>> 0;
}
function Hu(e) {
	let t = 4294967295;
	for (let n of e) t = Vu[(t ^ n) & 255] ^ t >>> 8;
	return (t ^ 4294967295) >>> 0;
}
function Uu(e, t, n) {
	e[t] = n & 255, e[t + 1] = n >>> 8 & 255;
}
function Q(e, t, n) {
	e[t] = n & 255, e[t + 1] = n >>> 8 & 255, e[t + 2] = n >>> 16 & 255, e[t + 3] = n >>> 24 & 255;
}
function Wu(e) {
	return new TextEncoder().encode(e);
}
var Gu = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;
function Ku(e) {
	return e.replace(Gu, "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&apos;");
}
function qu(e) {
	let t = "", n = e + 1;
	for (; n > 0;) {
		let e = (n - 1) % 26;
		t = String.fromCharCode(65 + e) + t, n = Math.floor((n - 1) / 26);
	}
	return t;
}
var Ju = 7, Yu = 5, Xu = Ju, Zu = 600, Qu = /* @__PURE__ */ new Set("ijl.,;:'!|`"), $u = /* @__PURE__ */ new Set("frtI()[]{}");
function ed(e) {
	if (e === " " || e === "	") return 4;
	if (e >= "0" && e <= "9") return Ju;
	if (Qu.has(e)) return 4;
	if ($u.has(e)) return 5;
	if (e >= "a" && e <= "z") return e === "m" || e === "w" ? 11 : 7;
	if (e >= "A" && e <= "Z") return e === "M" || e === "W" ? 12 : 8;
	let t = e.codePointAt(0) ?? 0;
	return t >= 4352 && t <= 4447 || t >= 11904 && t <= 42191 || t >= 44032 && t <= 55203 || t >= 63744 && t <= 64255 || t >= 65040 && t <= 65135 || t >= 65281 && t <= 65376 || t >= 65504 && t <= 65510 || t >= 127744 ? 14 : 8;
}
function td(e) {
	let t = 0;
	for (let n of e) t += ed(n);
	return t;
}
function nd(e) {
	let t = 0;
	for (let n of String(e).split(/\r\n|\n|\r/)) t = Math.max(t, td(n));
	return t;
}
function rd(e) {
	let t = Math.trunc(e / 100), n = e % 100;
	return n === 0 ? String(t) : n % 10 == 0 ? `${t}.${n / 10}` : `${t}.${String(n).padStart(2, "0")}`;
}
function id(e) {
	return rd(Math.floor((Math.min(e, Zu) - Yu) * 100 / Ju));
}
function ad(e) {
	return rd(Math.ceil((Math.min(Math.max(e, Yu), Zu) - Yu) * 100 / Ju));
}
function od(e, t) {
	let n = e.reduce((e, t) => Math.max(e, t.length), 0);
	for (let e of t.keys()) n = Math.max(n, e + 1);
	let r = Array(n).fill(0);
	for (let t of e) t.forEach((e, t) => {
		r[t] = Math.max(r[t], nd(e));
	});
	let i = [];
	return r.forEach((e, n) => {
		let r = t.get(n);
		if (r == null && e <= 0) return;
		let a = r == null ? id(Math.min(e + Yu + Xu, Zu)) : ad(r), o = n + 1;
		i.push(`<col min="${o}" max="${o}" width="${a}" customWidth="1"/>`);
	}), i.length === 0 ? "" : `<cols>${i.join("")}</cols>`;
}
var sd = 0, cd = 1, ld = 2, ud = /* @__PURE__ */ new Set([
	"SKU",
	"MSKU",
	"MSKUs",
	"Product Name",
	"Title",
	"Product",
	"Other Actions",
	"Additional Notes"
]), dd = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>", fd = "http://schemas.openxmlformats.org/spreadsheetml/2006/main", pd = "http://schemas.openxmlformats.org/package/2006/relationships", md = "http://schemas.openxmlformats.org/officeDocument/2006/relationships", hd = "application/vnd.openxmlformats-officedocument.spreadsheetml", gd = [
	dd,
	`<styleSheet xmlns="${fd}">`,
	"<fonts count=\"1\"><font><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font></fonts>",
	"<fills count=\"2\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill></fills>",
	"<borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders>",
	"<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>",
	"<cellXfs count=\"3\">",
	"<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\"/></xf>",
	"<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment horizontal=\"left\" vertical=\"center\"/></xf>",
	"<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment horizontal=\"center\" vertical=\"center\" wrapText=\"1\"/></xf>",
	"</cellXfs>",
	"<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>",
	"</styleSheet>"
].join("");
function _d(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) n.forEach((e, n) => {
		typeof e == "string" && ud.has(e) && t.add(n);
	});
	return t;
}
function vd(e) {
	return typeof e == "string" && e.trim() === "";
}
function $(e) {
	let t = Math.round(e * 72 / 96 * 100) / 100;
	return String(t);
}
function yd(e, t, n) {
	return vd(t) ? "" : typeof t == "number" && Number.isFinite(t) ? `<c r="${e}" s="${n}"><v>${String(t)}</v></c>` : `<c r="${e}" s="${n}" t="inlineStr"><is><t>${Ku(String(t))}</t></is></c>`;
}
function bd(e) {
	let t = e.rows ?? [], n = `${dd}<worksheet xmlns="${fd}">`;
	if (t.length === 0) return `${n}<sheetData/></worksheet>`;
	let r = new Map((e.fixedColumns ?? []).map((e) => [e.index, e.widthPx])), i = new Set((e.fixedColumns ?? []).filter((e) => e.wrapHeader).map((e) => e.index)), a = _d(t), o = t.map((t, n) => {
		let r = n + 1, o = t.map((e, t) => {
			let o = n === 0 ? i.has(t) ? ld : sd : a.has(t) ? cd : sd;
			return yd(`${qu(t)}${r}`, e, o);
		}).join("");
		return `<row r="${r}"${n === 0 && e.headerRowHeightPx != null ? ` ht="${$(e.headerRowHeightPx)}" customHeight="1"` : ""}>${o}</row>`;
	}).join("");
	return `${n}${od(t, r)}<sheetData>${o}</sheetData></worksheet>`;
}
function xd(e) {
	let t = [], n = [], r = 0;
	for (let i of e) {
		let e = Wu(i.name), a = Hu(i.data), o = new Uint8Array(30 + e.length + i.data.length);
		Q(o, 0, 67324752), Uu(o, 4, 20), Uu(o, 8, 0), Q(o, 14, a), Q(o, 18, i.data.length), Q(o, 22, i.data.length), Uu(o, 26, e.length), o.set(e, 30), o.set(i.data, 30 + e.length), t.push(o);
		let s = new Uint8Array(46 + e.length);
		Q(s, 0, 33639248), Uu(s, 4, 20), Uu(s, 6, 20), Q(s, 16, a), Q(s, 20, i.data.length), Q(s, 24, i.data.length), Uu(s, 28, e.length), Q(s, 42, r), s.set(e, 46), n.push(s), r += o.length;
	}
	let i = n.reduce((e, t) => e + t.length, 0), a = /* @__PURE__ */ new Uint8Array(22);
	Q(a, 0, 101010256), Uu(a, 8, e.length), Uu(a, 10, e.length), Q(a, 12, i), Q(a, 16, r);
	let o = new Uint8Array(r + i + a.length), s = 0;
	for (let e of t) o.set(e, s), s += e.length;
	for (let e of n) o.set(e, s), s += e.length;
	return o.set(a, s), o;
}
function Sd(e) {
	if (e.length === 0) throw Error("A workbook needs at least one worksheet.");
	let t = e.map((e, t) => {
		let n = t + 1;
		return {
			id: n,
			name: e.name,
			path: `xl/worksheets/sheet${n}.xml`,
			relId: `rId${n}`,
			xml: bd(e)
		};
	}), n = [
		dd,
		"<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">",
		"<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>",
		"<Default Extension=\"xml\" ContentType=\"application/xml\"/>",
		`<Override PartName="/xl/workbook.xml" ContentType="${hd}.sheet.main+xml"/>`,
		`<Override PartName="/xl/styles.xml" ContentType="${hd}.styles+xml"/>`,
		...t.map((e) => `<Override PartName="/${e.path}" ContentType="${hd}.worksheet+xml"/>`),
		"</Types>"
	].join(""), r = [
		dd,
		`<Relationships xmlns="${pd}">`,
		`<Relationship Id="rId1" Type="${md}/officeDocument" Target="xl/workbook.xml"/>`,
		"</Relationships>"
	].join(""), i = [
		dd,
		`<workbook xmlns="${fd}" xmlns:r="${md}">`,
		"<sheets>",
		...t.map((e) => `<sheet name="${Ku(e.name)}" sheetId="${e.id}" r:id="${e.relId}"/>`),
		"</sheets>",
		"</workbook>"
	].join(""), a = `rId${t.length + 1}`, o = [
		dd,
		`<Relationships xmlns="${pd}">`,
		...t.map((e) => `<Relationship Id="${e.relId}" Type="${md}/worksheet" Target="worksheets/sheet${e.id}.xml"/>`),
		`<Relationship Id="${a}" Type="${md}/styles" Target="styles.xml"/>`,
		"</Relationships>"
	].join("");
	return xd([
		{
			name: "[Content_Types].xml",
			data: Wu(n)
		},
		{
			name: "_rels/.rels",
			data: Wu(r)
		},
		{
			name: "xl/workbook.xml",
			data: Wu(i)
		},
		{
			name: "xl/_rels/workbook.xml.rels",
			data: Wu(o)
		},
		{
			name: "xl/styles.xml",
			data: Wu(gd)
		},
		...t.map((e) => ({
			name: e.path,
			data: Wu(e.xml)
		}))
	]);
}
// src/lib/reports.ts
var Cd = [
	"Daily Tasks",
	"Unfulfillable",
	"Stranded",
	"Suppressed",
	"Shipping Queue"
], wd = /[/\\:*?"<>|]/g;
function Td(e) {
	return yc(e);
}
function Ed(e) {
	return e.replace(wd, " ").replace(/\s+/g, " ").trim() || "Unknown";
}
function Dd(e, t = /* @__PURE__ */ new Date()) {
	return `${Ed(e)} - ${Td(t)}.xlsx`;
}
function Od(e, t = /* @__PURE__ */ new Date()) {
	return `${Ed(e)} - ${Td(t)} - Sheets.xlsx`;
}
function kd(e, t) {
	return !e.sections || e.sections.includes(t);
}
function Ad(e, t, n = `${t}s`) {
	return `${e} ${e === 1 ? t : n}`;
}
function jd(e) {
	let t = [], n = (e, n) => t.push({
		source: e,
		text: n
	}), r = (e, t) => e.filter(t).length, { unfulfillableListings: i, feedbacks: a, suppressedListings: o, shipments: s } = e;
	i.some((e) => e.listingsIncomplete) && n("unfulfillable", `Only ${Ad(i.length, "unfulfillable listing")} loaded; Seller Central lists more.`);
	let c = r(i, (e) => e.removalFetchFailed);
	c && n("unfulfillable", `Removal status is missing for ${Ad(c, "SKU")}.`), a.some((e) => e.feedbackIncomplete) && n("feedback", `Only ${Ad(a.length, "feedback entry", "feedback entries")} loaded; Seller Central has more.`), o.some((e) => e.listingsIncomplete) && n("suppressed", "Some search-suppressed listings couldn’t be loaded.");
	let l = r(o, (e) => e.issuesFetchFailed);
	l && n("suppressed", `Suppression reasons are missing for ${Ad(l, "SKU")}.`), s.some((e) => e.listingsIncomplete) && n("shippingQueue", "Some shipments couldn’t be listed.");
	let u = r(s, (e) => e.detailsFetchFailed);
	u && n("shippingQueue", `Details are missing for ${Ad(u, "shipment")}.`);
	let d = r(s, (e) => Al(e.details));
	return d && n("shippingQueue", `SKU lines are incomplete for ${Ad(d, "shipment")}.`), t;
}
function Md(e = {}) {
	let t = {
		"Daily Tasks": {
			source: "feedback",
			rows: () => $c(e.feedbacks ?? [])
		},
		Unfulfillable: {
			source: "unfulfillable",
			rows: () => fu(e.unfulfillableListings ?? [])
		},
		Stranded: {
			source: "stranded",
			rows: () => Xl(e.strandedListings ?? [])
		},
		Suppressed: {
			source: "suppressed",
			rows: () => Bu(e.suppressedListings ?? [])
		},
		"Shipping Queue": {
			source: "shippingQueue",
			rows: () => Y(e.shipments ?? [])
		}
	};
	return Cd.filter((n) => kd(e, t[n].source)).map((e) => ({
		name: e,
		rows: t[e].rows()
	}));
}
function Nd(e = Cd.map((e) => ({ name: e }))) {
	return Sd(e);
}
function Pd(e, t, n = document) {
	let r = new ArrayBuffer(e.byteLength);
	new Uint8Array(r).set(e);
	let i = new Blob([r], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), a = URL.createObjectURL(i), o = n.createElement("a");
	o.href = a, o.download = t, o.tabIndex = -1, o.setAttribute("aria-hidden", "true"), o.style.position = "fixed", o.style.left = "-9999px", o.style.top = "0", n.body.append(o), o.click(), o.remove(), URL.revokeObjectURL(a);
}
// src/lib/sheetPaste.ts
var Fd = "JMG Outdoors", Id = [
	{ header: "Date" },
	{
		header: "MSKU",
		source: "SKU"
	},
	{
		header: "Product Name",
		source: "Title"
	},
	{
		header: "Carrier Damaged",
		source: "Carrier Damaged"
	},
	{
		header: "Customer Damaged",
		source: "Customer Damaged"
	},
	{
		header: "Defective",
		source: "Defective"
	},
	{
		header: "Expired",
		source: "Expired"
	},
	{
		header: "Warehouse Damaged",
		source: "Warehouse Damaged"
	},
	{
		header: "Total Quantity",
		source: "Unfulfillable"
	},
	{ header: "Action" },
	{ header: "Date of E-Mail" },
	{ header: "Removal Order ID" },
	{ header: "Case ID" },
	{ header: "Case Status" },
	{ header: "Additional Notes" }
], Ld = { header: "Product" }, Rd = [
	{ header: "Date" },
	{
		header: "ASIN",
		source: "ASIN"
	},
	{
		header: "MSKU",
		source: "SKU"
	},
	{
		header: "Product Name",
		source: "Product Name"
	},
	{
		header: "Condition",
		source: "Condition"
	},
	{
		header: "Stranded Reason",
		source: "Stranded reason"
	},
	{ header: "Action" },
	{ header: "Other Actions" },
	{ header: "Date of E-Mail" },
	{ header: "Removal Order ID" },
	{ header: "Case ID" },
	{ header: "Case Status" }
], zd = [
	{ header: "Date" },
	{
		header: "Feedback Date",
		source: "Date",
		date: !0
	},
	{
		header: "Order ID",
		source: "Order ID"
	},
	{
		header: "Feedback Rating",
		source: "Rating"
	},
	{ header: "Action" },
	{ header: "Other Actions" },
	{ header: "Date of E-Mail" },
	{ header: "Case ID" },
	{ header: "Case Status" }
], Bd = [
	{ header: "Date" },
	{
		header: "MSKU",
		source: "SKU"
	},
	{
		header: "ASIN",
		source: "ASIN"
	},
	{
		header: "Product Name",
		source: "Title"
	},
	{
		header: "Reason for Suppressed/LE",
		source: "Issue"
	},
	{ header: "Action" },
	{ header: "Other Actions" },
	{ header: "Date of E-Mail" },
	{ header: "Removal Order ID" },
	{ header: "Case ID" },
	{ header: "Case Status" }
], Vd = [
	{ header: "Date of Reconciliation" },
	{
		header: "Shipment Date",
		source: "Created Date",
		date: !0
	},
	{
		header: "Shipment ID",
		source: "Shipment ID"
	},
	{
		header: "SKU",
		source: "SKU"
	},
	{
		header: "Discrepancy",
		source: "Item Discrepancy Quantity"
	},
	{ header: "Required Document" },
	{ header: "Status" },
	{ header: "Action" },
	{ header: "Date of E-Mail" },
	{ header: "Reimbursement ID" },
	{ header: "Amount / Unit" },
	{ header: "Case ID" },
	{ header: "Case Status" }
], Hd = Object.fromEntries(_c.map((e) => [e.toLowerCase(), e])), Ud = Object.fromEntries(_c.map((e, t) => [String(t + 1).padStart(2, "0"), e])), Wd = /^(\d{2})-([A-Za-z]{3}|\d{2})-(\d{4})/, Gd = "Multiple Actions Applicable - Refer to Additional Notes for Details", Kd = "Manual Removal Order Created", qd = "Scheduled for Removal", Jd = "Temporarily Unavailable for Removal", Yd = "Manual Removal Created and Temporarily Unavailable", Xd = "Manual Removal Order Created and Scheduled for Removal", Zd = "Scheduled for Removal and Temporarily Unavailable", Qd = "Damaged at the FC - For Monitoring", $d = "Temporarily Unavailable", ef = "N/A", tf = "Not Applicable", nf = [
	"Action",
	"Other Actions",
	"Date of E-Mail",
	"Removal Order ID",
	"Case ID"
], rf = /* @__PURE__ */ new Set([nl, ol]), af = /* @__PURE__ */ new Set([
	"Carrier Damaged",
	"Customer Damaged",
	"Defective",
	"Expired",
	"Warehouse Damaged",
	"Total Quantity"
]), of = 70, sf = 32, cf = [Ql, "Available for Removal"], lf = [ru.InventoryInPendingRequest, "Scheduled for Removal"], uf = [ru.InventoryIsBound, "Temporarily Unavailable for Removal"], df = [ru.InventoryIsWarehouseDamaged, "Damaged in the Fulfillment Center"], ff = [
	ru.InventoryInUnsupportedFc,
	ru.InventoryInUnsupportedBzFc,
	ru.InventoryInPickupRemovalUnsupportedFc,
	"In location that can not process Removal"
];
function pf(e) {
	return Ed(e) === Fd ? [
		Id[0],
		Ld,
		...Id.slice(1)
	] : Id;
}
function mf(e) {
	return e.flatMap((e, t) => typeof e == "string" && af.has(e) ? [{
		index: t,
		widthPx: of,
		wrapHeader: !0
	}] : []);
}
function hf(e) {
	return yc(new Date(e.getFullYear(), e.getMonth(), e.getDate() - 1));
}
function gf(e) {
	if (typeof e != "string") return e;
	let t = Wd.exec(e);
	if (!t) return e;
	let n = Hd[t[2].toLowerCase()] ?? Ud[t[2]];
	return n ? `${t[1]}-${n}-${t[3]}` : e;
}
function _f(e, t) {
	return e.findIndex((e) => t.every((t, n) => e[n] === t));
}
function vf(e, t, n) {
	let r = _f(e, t);
	if (r < 0) return [];
	let i = e[r].findIndex((e) => e === n);
	return i < 0 ? [] : e.slice(r + 1).map((e) => {
		let t = e[i];
		return t == null || t === "" ? "" : t;
	});
}
function yf(e, t) {
	return e.map((e, n) => {
		if (n === 0) return e;
		let r = [...e];
		return r[0] = t, r;
	});
}
function bf(e) {
	return e.split(/\s*\|\|\s*/).map((e) => e.trim()).filter(Boolean);
}
function xf(e, t) {
	return t.some((t) => e.includes(t));
}
function Sf(e) {
	let t = bf(e), n = t.some((e) => xf(e, cf)), r = t.some((e) => xf(e, lf)), i = t.some((e) => xf(e, uf)), a = t.some((e) => xf(e, df)), o = t.some((e) => xf(e, ff));
	return t.length > 2 || a && t.length > 1 ? Gd : n && i ? Yd : n && r ? Xd : r && i ? Zd : n ? Kd : r ? qd : i ? Jd : o ? $d : a ? Qd : Gd;
}
function Cf(e, t) {
	return bf(e).some((e) => xf(e, cf)) && t ? t : ef;
}
function wf(e, t, n) {
	if (e.length === 0) return e;
	let r = e[0], i = r.indexOf("Action"), a = r.indexOf("Date of E-Mail"), o = r.indexOf("Removal Order ID"), s = r.indexOf("Case ID"), c = r.indexOf("Case Status"), l = r.indexOf("Additional Notes");
	return e.map((e, r) => {
		if (r === 0) return e;
		let u = [...e], d = String(t[r - 1] ?? "");
		return i >= 0 && (u[i] = Sf(d)), a >= 0 && (u[a] = ef), o >= 0 && (u[o] = Cf(d, n)), s >= 0 && (u[s] = ef), c >= 0 && (u[c] = tf), l >= 0 && (u[l] = d), u;
	});
}
function Tf(e) {
	if (e.length === 0) return e;
	let t = e[0], n = nf.map((e) => t.indexOf(e)).filter((e) => e >= 0), r = t.indexOf("Case Status");
	return e.map((e, t) => {
		if (t === 0) return e;
		let i = [...e];
		for (let e of n) i[e] = ef;
		return r >= 0 && (i[r] = tf), i;
	});
}
function Ef(e, t) {
	let n = [Vd.map((e) => e.header)], r = "";
	for (let i of Rl(e)) {
		let e = (i.details?.items ?? []).filter((e) => typeof e.totalDiscrepancyQuantity == "number" && e.totalDiscrepancyQuantity < 0), a = i.detailsFetchFailed === !0 || !i.details;
		for (let o of e) {
			let e = i.shipmentId?.trim() ?? "", s = e !== "" && e === r, c = o.totalDiscrepancyQuantity ?? 0, l = X({
				detailsFailed: a,
				shipmentIneligibilityReason: i.details?.ineligibilityReason,
				itemIneligibilityReason: o.ineligibilityReason,
				discrepancy: c,
				eligible: i.details?.eligible
			});
			if (!rf.has(l)) continue;
			let u = o.caseId?.trim() || ef, d = o.merchantSKU?.trim() || ef, f = s ? "" : gf(bl(i.createdDate)), p = s ? "" : e, m = f === "" && p === "" ? "" : t;
			n.push([
				m,
				f,
				p,
				d,
				c,
				i.documentsFetchFailed ? "N/A" : zl(i.documentTypes, l),
				l,
				ef,
				t,
				ef,
				ef,
				u,
				tf
			]), e && (r = e);
		}
	}
	return n;
}
function Df(e, t, n) {
	let r = _f(e, t), i = r >= 0 ? e[r] : t, a = /* @__PURE__ */ new Map();
	i.forEach((e, t) => {
		typeof e == "string" && !a.has(e) && a.set(e, t);
	});
	let o = r >= 0 ? e.slice(r + 1) : [];
	return [n.map((e) => e.header), ...o.map((e) => n.map((t) => {
		if (!t.source) return "";
		let n = a.get(t.source);
		if (n == null) return "";
		let r = e[n], i = r == null || r === "" ? "" : r;
		return t.date ? gf(i) : i;
	}))];
}
function Of(e) {
	let t = hf(e.generatedAt), n = (e) => yf(e, t);
	return [
		{
			source: "unfulfillable",
			sheet: () => {
				let t = fu(e.unfulfillableListings), r = n(wf(Df(t, Zl, pf(e.storeName)), vf(t, Zl, "Removal Status"), e.nextRemovalOrderId));
				return {
					name: "UnfulfillableDisposals",
					rows: r,
					fixedColumns: mf(r[0] ?? []),
					headerRowHeightPx: sf
				};
			}
		},
		{
			source: "stranded",
			sheet: () => ({
				name: "Stranded",
				rows: n(Tf(Df(Xl(e.strandedListings), Vl, Rd)))
			})
		},
		{
			source: "feedback",
			sheet: () => ({
				name: "Feedback",
				rows: n(Tf(Df(Zc(e.feedbacks.filter((e) => e.suppressed === !1)), Vc, zd)))
			})
		},
		{
			source: "suppressed",
			sheet: () => ({
				name: "SuppressedLE",
				rows: n(Tf(Df(Bu(e.suppressedListings), gu, Bd)))
			})
		},
		{
			source: "shippingQueue",
			sheet: () => ({
				name: "Shipping Queue",
				rows: Ef(e.shipments, t)
			})
		}
	].filter(({ source: t }) => kd(e, t)).map(({ sheet: e }) => e());
}
// src/lib/reportDownload.ts
function kf(e, t, n = document) {
	let r = Nd(t === "sheets" ? Of(e) : Md(e)), i = t === "sheets" ? Od(e.storeName, e.generatedAt) : Dd(e.storeName, e.generatedAt);
	return Pd(r, i, n), {
		fileName: i,
		bytes: r.byteLength
	};
}
// src/lib/settings.ts
var Af = [
	"open-case-ids",
	"scrape-case",
	"open-shipment-ids",
	"search-skus",
	"time-out",
	"generate-reports",
	"accounts"
], jf = {
	"open-case-ids": !0,
	"scrape-case": !0,
	"open-shipment-ids": !0,
	"search-skus": !0,
	"time-out": !0,
	"generate-reports": !0,
	accounts: !0
}, Mf = {
	staffName: "Dhylan Mapesos",
	business: "S4E",
	supervisor: "Lou",
	hoursWorked: "4",
	scheduledAccountsCompleted: "Yes",
	shortDailyUpdate: "",
	blockersOrRedFlags: "No",
	clientAccountName: "",
	issueType: "",
	waitingOnWhom: "",
	followUpNeeded: "No",
	escalatedToSupervisor: "No",
	supervisorReviewNeeded: "No",
	karenReviewNeeded: "No"
};
function Nf(e) {
	return e && typeof e == "object" ? e : {};
}
function Pf(e) {
	let t = Nf(e), n = Nf(t.features), r = Nf(t.timeOutForm), i = { ...jf };
	for (let e of Af) {
		let t = n[e];
		typeof t == "boolean" && (i[e] = t);
	}
	let a = { ...Mf };
	for (let e of Object.keys(Mf)) {
		let t = r[e];
		typeof t == "string" && (a[e] = t);
	}
	return {
		features: i,
		timeOutForm: a
	};
}
function Ff(e, t) {
	return !Af.includes(t) || e[t] !== !1;
}
function If(e, t) {
	return Af.every((n) => e[n] === t[n]);
}
// src/lib/removalOrderIds.ts
var Lf = /(?<![a-z0-9])S4E[a-z]{2}\d{4}(?![a-z0-9])/gi;
function Rf(e) {
	return (e.match(Lf) ?? []).map((e) => e.toUpperCase());
}
function zf(e) {
	return [...new Set(Rf(e))];
}
// src/lib/shipmentIds.ts
var Bf = /(?<![a-z0-9])FBA[a-z0-9]{9}(?![a-z0-9])/gi;
function Vf(e) {
	return (e.match(Bf) ?? []).map((e) => e.toUpperCase());
}
function Hf(e) {
	return [...new Set(Vf(e))];
}
// src/lib/skuIds.ts
var Uf = 40;
function Wf(e) {
	return e.split(/[\n\r,\t]+/u).map((e) => e.trim()).filter((e) => e && e.length <= Uf);
}
function Gf(e) {
	return [...new Set(Wf(e))];
}
// src/ReportProgressPanel.tsx
var Kf = "Connecting to Seller Central…";
function qf(e) {
	return ec.find((t) => t.id === e)?.label ?? e;
}
function Jf(e, t, n) {
	return e === "complete" && n ? /* @__PURE__ */ (0, H.jsx)(fe, {
		"aria-hidden": "true",
		className: "size-4 text-warning"
	}) : e === "complete" ? /* @__PURE__ */ (0, H.jsx)("span", {
		"aria-hidden": "true",
		className: "flex size-4 animate-check-in items-center justify-center rounded-full bg-primary text-primary-foreground",
		children: /* @__PURE__ */ (0, H.jsx)(k, {
			className: "size-2.5",
			strokeWidth: 3.5
		})
	}) : e === "error" ? /* @__PURE__ */ (0, H.jsx)(ie, {
		"aria-hidden": "true",
		className: "size-4 text-destructive"
	}) : e === "active" && !t ? /* @__PURE__ */ (0, H.jsx)(Ys, {
		"aria-hidden": "true",
		className: "size-4 text-foreground",
		role: "presentation"
	}) : /* @__PURE__ */ (0, H.jsx)("span", {
		"aria-hidden": "true",
		className: "size-4 rounded-full border-[0.0938rem] border-dashed border-ring"
	});
}
function Yf(e, t) {
	return t.status === "pending" ? 0 : cc({
		source: e,
		status: t.status === "error" ? "error" : t.status === "complete" ? "complete" : "active",
		loaded: t.loaded,
		total: t.total,
		phase: t.phase
	});
}
function Xf(e, t, n, r) {
	if (n) return "Report generation failed.";
	if (e.prepare === "active") return Kf;
	if (sc(e, t) === "complete") return r.length ? `Report ready. ${r.map((e) => e.text).join(" ")}` : "Report ready.";
	let i = e.sections.filter((t) => e.sources[t].status === "active").map(qf);
	return i.length > 0 ? `${i.join(", ")}.` : "Generating report.";
}
function Zf(e, t, n) {
	if (e.prepare === "active") return t ? [] : [{
		id: "prepare",
		text: Kf
	}];
	let r = [], i = [];
	for (let t of e.sections) {
		let n = e.sources[t];
		n.status === "error" ? r.push({
			id: t,
			text: n.error ?? `${qf(t)} failed.`,
			tone: "error"
		}) : n.status === "active" && (n.loaded != null || n.total != null) && i.push({
			id: t,
			text: gc(t, n)
		});
	}
	return n.forEach((e, t) => r.push({
		id: `${e.source}-${t}`,
		text: e.text,
		tone: "warning"
	})), r.length > 0 ? r : i;
}
function Qf({ failed: e = !1, progress: t, submitting: n, warnings: r = [] }) {
	let i = Zf(t, e, r).filter((e) => e.tone), a = new Set(r.map((e) => e.source));
	return /* @__PURE__ */ (0, H.jsxs)("div", {
		className: "flex flex-col px-1.5 py-2",
		children: [
			/* @__PURE__ */ (0, H.jsx)("p", {
				"aria-live": "polite",
				className: "sr-only",
				children: Xf(t, n, e, r)
			}),
			/* @__PURE__ */ (0, H.jsx)("div", {
				className: "flex flex-col",
				role: "list",
				children: ec.filter((e) => t.sections.includes(e.id)).map((n) => {
					let r = t.sources[n.id];
					return /* @__PURE__ */ (0, H.jsx)(ep, {
						current: r.status === "active" && !e && t.prepare !== "active",
						detail: $f(n.id, r, t.prepare === "active"),
						label: n.label,
						partial: a.has(n.id),
						percent: Yf(n.id, r),
						status: r.status,
						stopped: e
					}, n.id);
				})
			}),
			t.prepare === "active" && !e ? /* @__PURE__ */ (0, H.jsx)("p", {
				className: "m-0 px-2 pt-1 text-xs leading-4 text-muted-foreground",
				children: Kf
			}) : null,
			i.map((e) => /* @__PURE__ */ (0, H.jsxs)("div", {
				className: V("mt-1 flex min-h-8 items-center gap-2.5 rounded-[0.375rem] px-2 py-1.5 text-xs leading-4", e.tone === "error" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"),
				children: [/* @__PURE__ */ (0, H.jsx)(ie, {
					"aria-hidden": "true",
					className: "size-4 shrink-0"
				}), /* @__PURE__ */ (0, H.jsx)("span", {
					className: "min-w-0 flex-1",
					children: e.text
				})]
			}, e.id))
		]
	});
}
function $f(e, t, n) {
	if (t.status === "pending" || n) return "Waiting";
	if (t.status === "error") return "Failed";
	if (t.status === "complete") {
		let e = t.loaded ?? t.total;
		return e == null ? "Done" : `${e.toLocaleString("en-US")} ${e === 1 ? "row" : "rows"}`;
	}
	return gc(e, t);
}
function ep({ current: e, detail: t, label: n, partial: r, percent: i, status: a, stopped: o }) {
	return /* @__PURE__ */ (0, H.jsxs)("div", {
		"aria-current": e ? "step" : void 0,
		"aria-label": n,
		"aria-valuetext": typeof i == "number" ? `${i}%` : void 0,
		className: V("flex h-8 items-center gap-2.5 rounded-[0.375rem] px-2 transition-colors duration-150", e && "bg-muted"),
		role: "listitem",
		children: [
			/* @__PURE__ */ (0, H.jsx)("span", {
				className: "flex size-4 shrink-0 items-center justify-center",
				children: Jf(a, o, r)
			}),
			/* @__PURE__ */ (0, H.jsx)("span", {
				className: V("min-w-0 flex-1 truncate text-sm", e ? "font-medium text-foreground" : a === "pending" ? "text-muted-foreground" : "text-foreground/80"),
				children: n
			}),
			/* @__PURE__ */ (0, H.jsx)("span", {
				className: V("shrink-0 text-xs leading-4 tabular-nums", e ? "text-foreground/70" : "text-muted-foreground"),
				children: t
			})
		]
	});
}
// src/components/ui/progress.tsx
function tp({ className: e, value: t, ...n }) {
	let r = t == null, i = r ? 0 : Math.min(100, Math.max(0, t || 0));
	return /* @__PURE__ */ (0, H.jsxs)(no, {
		"data-slot": "progress",
		"data-indeterminate": r || void 0,
		className: V("relative h-1 w-full overflow-hidden rounded-full bg-muted", e),
		value: r ? null : t,
		...n,
		children: [/* @__PURE__ */ (0, H.jsx)(ro, {
			"data-slot": "progress-indicator",
			className: "size-full flex-1 bg-primary transition-transform duration-500 ease-out-expo motion-reduce:transition-none",
			style: { transform: `translateX(-${100 - i}%)` }
		}), /* @__PURE__ */ (0, H.jsx)("span", {
			"aria-hidden": "true",
			"data-slot": "progress-indeterminate",
			className: V("pointer-events-none absolute inset-y-0 left-0 w-[35%] bg-primary motion-reduce:hidden", r ? "opacity-100" : "opacity-0 transition-opacity duration-300 ease-out")
		})]
	});
}
// src/SwitchProgress.tsx
var np = {
	logout: "Signing out of the current account…",
	signin: "Opening Amazon sign-in…",
	email: "Entering the account email…",
	password: "Entering the password…",
	otp: "Entering the verification code…",
	paused: "Sign-in needs your attention.",
	store: "Opening and checking the selected store…",
	authenticated: "Opening the store…"
}, rp = 750, ip = [
	{
		id: "sign-out",
		label: "Sign out",
		stages: ["logout"]
	},
	{
		id: "sign-in",
		label: "Sign in",
		stages: [
			"signin",
			"email",
			"password"
		]
	},
	{
		id: "code",
		label: "Verification code",
		stages: ["otp"]
	},
	{
		id: "store",
		label: "Open store",
		stages: ["store", "authenticated"]
	}
], ap = ip.slice(-1), op = {
	pending: "Waiting",
	active: "",
	attention: "Needs you",
	complete: "Done"
};
function sp(e) {
	let t = e.stage === "paused", n = t ? e.resumeStage : e.stage, r = e.signIn ? ip : ap, i = Math.max(0, r.findIndex((e) => n !== void 0 && e.stages.includes(n)));
	return {
		steps: r.map((e, n) => ({
			id: e.id,
			label: e.label,
			status: n < i ? "complete" : n > i ? "pending" : t ? "attention" : "active"
		})),
		completed: i,
		total: r.length,
		percent: Math.round((i + .5) / r.length * 100),
		paused: t
	};
}
function cp(e, { doneStoreName: t, onEnded: n }) {
	let [r, i] = _.useState(null), [a, o] = _.useState(t ?? null), s = _.useRef(null), c = _.useRef(n);
	return c.current = n, _.useEffect(() => {
		if (a) return;
		let t = !1, n, r = async () => {
			try {
				let n = await e();
				if (t) return;
				if (!n.activeSwitch) {
					let e = s.current;
					e && n.currentStore?.id === e.storeId ? o(e.storeName) : c.current();
					return;
				}
				s.current = n.activeSwitch, i(n.activeSwitch);
			} catch {}
			t || (n = window.setTimeout(() => void r(), rp));
		};
		return r(), () => {
			t = !0, window.clearTimeout(n);
		};
	}, [a, e]), {
		active: r,
		doneName: a
	};
}
function lp(e, t, n) {
	let r = _.useRef({
		onDismiss: t,
		isUserEvent: n
	});
	r.current = {
		onDismiss: t,
		isUserEvent: n
	}, _.useEffect(() => {
		if (!e) return;
		let t = (e) => {
			r.current.isUserEvent(e) && r.current.onDismiss();
		};
		return window.addEventListener("pointerdown", t, !0), window.addEventListener("keydown", t, !0), () => {
			window.removeEventListener("pointerdown", t, !0), window.removeEventListener("keydown", t, !0);
		};
	}, [e]);
}
var up = (e) => e.isTrusted;
function dp() {
	let [e, t] = _.useState(!1), [n, r] = _.useState(null);
	return {
		busy: e,
		error: n,
		run: async (e, n) => {
			t(!0), r(null);
			try {
				await e(), n?.();
			} catch (e) {
				r(e instanceof Error ? e.message : "Couldn’t update the store switch.");
			} finally {
				t(!1);
			}
		}
	};
}
function fp({ className: e }) {
	return /* @__PURE__ */ (0, H.jsx)("span", {
		"aria-hidden": "true",
		className: V("flex size-4 animate-check-in items-center justify-center rounded-full bg-primary text-primary-foreground", e),
		children: /* @__PURE__ */ (0, H.jsx)(k, {
			className: "size-2.5",
			strokeWidth: 3.5
		})
	});
}
function pp(e) {
	return e === "complete" ? /* @__PURE__ */ (0, H.jsx)(fp, {}) : e === "active" ? /* @__PURE__ */ (0, H.jsx)(Ys, {
		"aria-hidden": "true",
		className: "size-4 text-foreground",
		role: "presentation"
	}) : e === "attention" ? /* @__PURE__ */ (0, H.jsx)(fe, {
		"aria-hidden": "true",
		className: "size-4 text-warning"
	}) : /* @__PURE__ */ (0, H.jsx)("span", {
		"aria-hidden": "true",
		className: "size-4 rounded-full border-[0.0938rem] border-dashed border-ring"
	});
}
function mp({ steps: e, compact: t = !1 }) {
	return /* @__PURE__ */ (0, H.jsx)("div", {
		className: "flex flex-col",
		role: "list",
		children: e.map((e) => {
			let n = e.status === "active" || e.status === "attention";
			return /* @__PURE__ */ (0, H.jsxs)("div", {
				"aria-current": n ? "step" : void 0,
				"aria-label": `${e.label}: ${op[e.status] || "In progress"}`,
				className: V("flex items-center gap-2.5 rounded-[0.375rem] px-2", t ? "h-7" : "h-8", n && "bg-muted"),
				role: "listitem",
				children: [
					/* @__PURE__ */ (0, H.jsx)("span", {
						className: "flex size-4 shrink-0 items-center justify-center",
						children: pp(e.status)
					}),
					/* @__PURE__ */ (0, H.jsx)("span", {
						className: V("min-w-0 flex-1 truncate text-sm", n ? "font-medium text-foreground" : e.status === "pending" ? "text-muted-foreground" : "text-foreground/80"),
						children: e.label
					}),
					/* @__PURE__ */ (0, H.jsx)("span", {
						className: V("shrink-0 text-xs leading-4", n ? "text-foreground/70" : "text-muted-foreground"),
						children: op[e.status]
					})
				]
			}, e.id);
		})
	});
}
function hp({ doneStoreName: e, isUserEvent: t = up, onCancel: n, onClose: r, onEnded: i, onGetAccountsStatus: a, onShowSignIn: o }) {
	let { active: s, doneName: c } = cp(a, {
		doneStoreName: e,
		onEnded: i
	}), { busy: l, error: u, run: d } = dp();
	lp(!!c, r, t);
	let f = s && !c ? sp(s) : null, p = c ? 100 : f?.percent ?? 0, m = c ? `Switched to ${c}` : f?.paused ? "Needs attention" : s ? `Switching to ${s.storeName}` : "Switching stores";
	return /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
		/* @__PURE__ */ (0, H.jsx)(Js, {
			aside: f ? /* @__PURE__ */ (0, H.jsxs)("span", {
				className: "tabular-nums",
				children: [
					f.completed,
					" of ",
					f.total
				]
			}) : null,
			divider: /* @__PURE__ */ (0, H.jsx)("div", {
				"aria-label": "Store switch progress",
				"aria-valuemax": 100,
				"aria-valuemin": 0,
				"aria-valuenow": p,
				className: "h-0.5 shrink-0 bg-muted",
				role: "progressbar",
				children: /* @__PURE__ */ (0, H.jsx)("div", {
					className: "h-full bg-primary transition-[width] duration-400 ease-out-expo motion-reduce:transition-none",
					style: { width: `${p}%` }
				})
			}),
			onBack: r,
			parent: "Switch store",
			title: m
		}),
		c ? /* @__PURE__ */ (0, H.jsxs)("div", {
			className: "flex gap-3 px-4 py-5",
			role: "status",
			children: [/* @__PURE__ */ (0, H.jsx)("span", {
				"aria-hidden": "true",
				className: "flex size-8 shrink-0 animate-check-in items-center justify-center rounded-[0.5rem] bg-primary text-primary-foreground",
				children: /* @__PURE__ */ (0, H.jsx)(k, {
					className: "size-4",
					strokeWidth: 3
				})
			}), /* @__PURE__ */ (0, H.jsxs)("div", {
				className: "flex flex-col gap-1",
				children: [/* @__PURE__ */ (0, H.jsxs)("p", {
					className: "m-0 text-base leading-6 font-medium",
					children: [c, " is ready"]
				}), /* @__PURE__ */ (0, H.jsx)("p", {
					className: "m-0 text-sm text-muted-foreground",
					children: "Seller Central now shows this store. Click anywhere or press any key to continue."
				})]
			})]
		}) : s && f ? /* @__PURE__ */ (0, H.jsxs)("div", {
			className: "flex flex-col px-1.5 py-2",
			children: [/* @__PURE__ */ (0, H.jsx)(mp, { steps: f.steps }), /* @__PURE__ */ (0, H.jsx)("div", {
				"aria-live": "polite",
				children: f.paused ? /* @__PURE__ */ (0, H.jsxs)("div", {
					className: "mt-1 flex min-h-8 items-center gap-2.5 rounded-[0.375rem] bg-warning/10 px-2 py-1.5 text-xs leading-4 text-warning",
					children: [/* @__PURE__ */ (0, H.jsx)(fe, {
						"aria-hidden": "true",
						className: "size-4 shrink-0"
					}), /* @__PURE__ */ (0, H.jsx)("span", {
						className: "min-w-0 flex-1",
						children: s.attentionMessage ?? np.paused
					})]
				}) : /* @__PURE__ */ (0, H.jsx)("p", {
					className: "m-0 px-2 pt-1 text-xs leading-4 text-muted-foreground",
					children: np[s.stage] ?? "Switching stores…"
				})
			})]
		}) : /* @__PURE__ */ (0, H.jsxs)("p", {
			className: "m-0 flex items-center gap-2.5 px-4 py-5 text-sm text-muted-foreground",
			role: "status",
			children: [/* @__PURE__ */ (0, H.jsx)(Ys, {
				"aria-hidden": "true",
				className: "size-4",
				role: "presentation"
			}), "Starting the switch…"]
		}),
		u ? /* @__PURE__ */ (0, H.jsxs)(Wt, {
			className: "mx-1.5 mb-1.5 w-auto",
			variant: "destructive",
			children: [/* @__PURE__ */ (0, H.jsx)(ie, { "aria-hidden": "true" }), /* @__PURE__ */ (0, H.jsx)(Gt, { children: u })]
		}) : null,
		/* @__PURE__ */ (0, H.jsx)(mo, {
			action: !0,
			end: c ? /* @__PURE__ */ (0, H.jsx)(ho, {
				autoFocus: !0,
				onClick: r,
				type: "button",
				children: "Done"
			}) : /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)(ao, {
				className: "rounded-[0.5rem] text-destructive hover:text-destructive",
				disabled: l || !s,
				onClick: () => void d(n, i),
				type: "button",
				variant: "ghost",
				children: "Cancel switch"
			}), f?.paused ? /* @__PURE__ */ (0, H.jsx)(ho, {
				autoFocus: !0,
				disabled: l,
				onClick: () => void d(o),
				type: "button",
				children: "Show sign-in"
			}) : /* @__PURE__ */ (0, H.jsx)(ao, {
				className: "rounded-[0.5rem]",
				disabled: l || !s,
				onClick: () => void d(o),
				type: "button",
				variant: "outline",
				children: "Show sign-in"
			})] }),
			children: /* @__PURE__ */ (0, H.jsx)(po, {
				keys: ["esc"],
				children: c ? "Close" : "Hide, keeps running"
			})
		})
	] });
}
function gp({ doneStoreName: e, isUserEvent: t = up, onCancel: n, onDismiss: r, onGetAccountsStatus: i, onShowSignIn: a }) {
	let { active: o, doneName: s } = cp(i, {
		doneStoreName: e,
		onEnded: r
	}), { busy: c, error: l, run: u } = dp();
	if (lp(!!s, r, t), !o && !s) return null;
	let d = o && !s ? sp(o) : null, f = s ? `Switched to ${s}` : d?.paused ? "Needs attention" : `Switching to ${o?.storeName}`, p = s ? "Seller Central now shows this store." : d?.paused ? o?.attentionMessage ?? np.paused : np[o?.stage ?? ""] ?? "Switching stores…";
	return /* @__PURE__ */ (0, H.jsxs)("section", {
		"aria-label": "Store switch",
		className: "fixed right-4 bottom-4 z-50 flex w-[20rem] animate-download-in flex-col overflow-hidden rounded-xl bg-popover text-sm text-popover-foreground shadow-[0_1.5rem_3rem_-1rem_rgb(0_0_0/0.22)] ring-1 ring-foreground/10",
		"data-slot": "switch-status",
		children: [
			/* @__PURE__ */ (0, H.jsxs)("div", {
				className: "flex items-start gap-2.5 px-3.5 pt-3 pb-2.5",
				children: [/* @__PURE__ */ (0, H.jsx)("span", {
					className: "flex h-5 w-4 shrink-0 items-center justify-center",
					children: s ? /* @__PURE__ */ (0, H.jsx)(fp, {}) : d?.paused ? /* @__PURE__ */ (0, H.jsx)(fe, {
						"aria-hidden": "true",
						className: "size-4 text-warning"
					}) : /* @__PURE__ */ (0, H.jsx)(Ys, {
						"aria-hidden": "true",
						className: "text-foreground/70",
						role: "presentation"
					})
				}), /* @__PURE__ */ (0, H.jsxs)("div", {
					"aria-live": "polite",
					className: "flex min-w-0 flex-1 flex-col gap-0.5",
					role: "status",
					children: [/* @__PURE__ */ (0, H.jsx)("span", {
						className: "truncate font-medium",
						children: f
					}), /* @__PURE__ */ (0, H.jsx)("span", {
						className: "text-xs leading-4 text-muted-foreground",
						children: p
					})]
				})]
			}),
			/* @__PURE__ */ (0, H.jsx)("div", {
				className: "px-3.5 pb-2.5",
				children: /* @__PURE__ */ (0, H.jsx)(tp, {
					"aria-label": "Store switch progress",
					value: s ? 100 : d?.percent ?? 0
				})
			}),
			d ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)("div", {
				className: "px-1.5 pb-1.5",
				children: /* @__PURE__ */ (0, H.jsx)(mp, {
					compact: !0,
					steps: d.steps
				})
			}), /* @__PURE__ */ (0, H.jsxs)("div", {
				className: "flex items-center justify-end gap-1.5 border-t border-border px-2.5 py-2",
				children: [
					l ? /* @__PURE__ */ (0, H.jsx)("span", {
						className: "mr-auto min-w-0 truncate text-xs leading-4 text-destructive",
						children: l
					}) : null,
					/* @__PURE__ */ (0, H.jsx)("button", {
						className: "h-7 shrink-0 rounded-[0.375rem] bg-background px-2.5 text-xs leading-4 font-medium text-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted disabled:opacity-50",
						disabled: c,
						onClick: () => void u(a),
						type: "button",
						children: "Show sign-in"
					}),
					/* @__PURE__ */ (0, H.jsx)("button", {
						className: "h-7 shrink-0 rounded-[0.375rem] px-2.5 text-xs leading-4 font-medium text-destructive transition-colors hover:bg-muted disabled:opacity-50",
						disabled: c,
						onClick: () => void u(n),
						type: "button",
						children: "Cancel"
					})
				]
			})] }) : null
		]
	});
}
// src/CommandPalette.tsx
var _p = 10, vp = 50, yp = 1e3, bp = typeof navigator < "u" && /Mac|iPhone|iPad/u.test(navigator.platform) ? "⌘" : "Ctrl", xp = {
	commands: 0,
	"case-ids": 1,
	"scrape-case": 1,
	"shipment-ids": 1,
	"sku-ids": 1,
	accounts: 1,
	"report-options": 1,
	"report-login": 1,
	"confirm-ids": 2,
	unlock: 2,
	"generating-reports": 2,
	switching: 2,
	"switch-done": 2
}, Sp = 12;
function Cp(e) {
	return e === "case-ids" || e === "scrape-case" || e === "shipment-ids" || e === "sku-ids";
}
function wp(e, t, n) {
	let r = e === "scrape" ? "Scrape" : "Open";
	return t === 0 ? r : `${r} ${t} ${n}${t === 1 ? "" : "s"}`;
}
function Tp(e) {
	return e === "scrape" ? "Scraping…" : "Opening…";
}
function Ep(e) {
	return e === "scrape" ? `Scrape no more than ${vp} cases at a time.` : `Open no more than ${vp} IDs at a time.`;
}
function Dp(e, t) {
	return t.length === 1 ? `Open ${e} ${t[0]}` : `Open ${t.length} ${e} IDs`;
}
var Op = {
	initialized: !1,
	unlocked: !1,
	stores: []
};
async function kp() {
	return Op;
}
var Ap = [
	{
		heading: "Open",
		commands: [
			{
				id: "open-case-ids",
				label: "Open case IDs",
				icon: le,
				keywords: [
					"case",
					"cases",
					"ticket",
					"support"
				]
			},
			{
				id: "scrape-case",
				label: "Scrape case",
				icon: oe,
				keywords: [
					"case",
					"cases",
					"scrape",
					"json",
					"export",
					"replies",
					"thread"
				]
			},
			{
				id: "open-shipment-ids",
				label: "Open shipment IDs",
				icon: pe,
				keywords: [
					"shipment",
					"shipments",
					"fba",
					"inbound",
					"transfer"
				]
			},
			{
				id: "search-skus",
				label: "Search SKUs",
				icon: ue,
				keywords: [
					"sku",
					"skus",
					"asin",
					"msku",
					"listing",
					"product"
				]
			},
			{
				id: "time-out",
				label: "Open Time Out",
				icon: ae,
				keywords: [
					"timeout",
					"time",
					"sheet",
					"form",
					"break"
				],
				external: !0
			}
		]
	},
	{
		heading: "Reports",
		commands: [{
			id: "generate-reports",
			label: "Generate reports",
			icon: se,
			keywords: [
				"report",
				"xlsx",
				"export",
				"spreadsheet"
			]
		}]
	},
	{
		heading: "Settings",
		commands: [{
			id: "accounts",
			label: "Switch store",
			icon: ne,
			keywords: [
				"account",
				"store",
				"stores",
				"switch",
				"login"
			]
		}]
	}
];
function jp({ children: e, disabled: t, label: n, onDownload: r, size: i = "default", title: a, variant: o = "default" }) {
	let s = _.useRef(-Infinity);
	return /* @__PURE__ */ (0, H.jsx)(ao, {
		"aria-label": n,
		className: V("active:not-aria-[haspopup]:translate-y-0", i === "default" ? "gap-2 rounded-[0.5rem] px-3" : "rounded-[0.5rem] text-foreground/80"),
		disabled: t,
		onClick: (e) => {
			e.detail > 0 && performance.now() - s.current < yp || r();
		},
		onPointerDown: (e) => {
			e.button !== 0 || t || (e.preventDefault(), s.current = performance.now(), r());
		},
		size: i,
		title: a,
		type: "button",
		variant: o,
		children: e
	});
}
function Mp({ container: e, open: t, initialMode: n, protectedResults: r = !1, initialIdentifierInput: i = "", onOpenReports: a = async () => void 0, onCancelReports: o = async () => void 0, onOpenCaseIds: s, onScrapeCases: c = async () => {
	throw Error("Couldn’t scrape cases. Please try again.");
}, onOpenShipmentIds: l, onOpenRemovalOrderIds: u = async () => void 0, onOpenSkuIds: d = async () => void 0, onGetAccountsStatus: f = kp, onUnlockAccounts: p = async () => void 0, onStartAccountSwitch: m = async () => void 0, onFocusCurrentStore: h = async () => void 0, onFocusAccountSwitch: g = async () => void 0, onCancelAccountSwitch: v = async () => void 0, onManageAccounts: y = async () => void 0, onPrepareReports: b = async () => ({ loggedInToStore: !0 }), onGenerateReports: x = async () => void 0, onDownloadReport: S = kf, onOpenTimeOut: C = async () => void 0, onOpenChange: w, enabledFeatures: T = jf, switchedStoreName: ee }) {
	let [E, D] = _.useState(t && n && (r || !["report-options", "generating-reports"].includes(n)) ? n : "commands"), [te, O] = _.useState(n && Cp(n) ? n : "case-ids"), [k, re] = _.useState(""), [ae, j] = _.useState(""), [se, M] = _.useState(i), [P, fe] = _.useState([]), [me, F] = _.useState(null), [I, L] = _.useState(!1), [he, ge] = _.useState(null), [_e, ve] = _.useState(tc), [ye, be] = _.useState($s), [xe, Se] = _.useState(null), [Ce, we] = _.useState([]), [Te, Ee] = _.useState(), [De, Oe] = _.useState(null), [ke, Ae] = _.useState(!1), [je, Me] = _.useState(!1), [Ne, Pe] = _.useState(null), [Fe, Ie] = _.useState("none"), Le = _.useRef(null), Re = _.useRef(0), ze = _.useCallback(() => w(!1), [w]), Be = _.useMemo(() => ({
		"case-ids": {
			action: "open",
			ariaLabel: "Case IDs",
			description: "Enter one or more 11-digit Amazon Seller Central Case IDs.",
			extractIds: Qs,
			failureError: "Couldn’t open case tabs. Please try again.",
			findIds: Zs,
			invalidError: "Enter at least one 11-digit Case ID.",
			label: "Paste one or more 11-digit case IDs",
			noun: "case",
			placeholder: "Paste case IDs, links or text…",
			submit: s,
			title: "Open case IDs",
			unit: "case ID"
		},
		"scrape-case": {
			action: "scrape",
			ariaLabel: "Case IDs",
			description: "Enter one or more 11-digit Amazon Seller Central Case IDs to download.",
			extractIds: Qs,
			failureError: "Couldn’t scrape cases. Please try again.",
			findIds: Zs,
			invalidError: "Enter at least one 11-digit Case ID.",
			label: "Paste one or more 11-digit case IDs",
			noun: "case",
			placeholder: "Paste case IDs, links or text…",
			submit: c,
			title: "Scrape case",
			unit: "case ID"
		},
		"shipment-ids": {
			action: "open",
			ariaLabel: "Shipment IDs",
			description: "Enter one or more Amazon Seller Central FBA Shipment IDs.",
			extractIds: Hf,
			failureError: "Couldn’t open shipment tabs. Please try again.",
			findIds: Vf,
			invalidError: "Enter at least one valid FBA Shipment ID.",
			label: "Paste one or more FBA shipment IDs",
			noun: "shipment",
			placeholder: "Paste shipment IDs, links or text…",
			submit: l,
			title: "Open shipment IDs",
			unit: "shipment ID"
		},
		"removal-order-ids": {
			action: "open",
			ariaLabel: "Removal order IDs",
			description: "Enter one or more S4E removal order IDs.",
			extractIds: zf,
			failureError: "Couldn’t open removal order tabs. Please try again.",
			findIds: Rf,
			invalidError: "Enter at least one valid removal order ID.",
			label: "Paste one or more removal order IDs",
			noun: "removal order",
			placeholder: "Paste removal order IDs, links or text…",
			submit: u,
			title: "Open removal orders",
			unit: "removal order ID"
		},
		"sku-ids": {
			action: "open",
			ariaLabel: "SKUs",
			description: "Enter one or more Amazon Seller Central SKUs, one per line.",
			extractIds: Gf,
			failureError: "Couldn’t open SKU tabs. Please try again.",
			findIds: Wf,
			invalidError: "Enter at least one SKU.",
			label: "Paste one or more SKUs, one per line",
			noun: "SKU",
			placeholder: "Paste SKUs, one per line…",
			submit: d,
			title: "Search SKUs",
			unit: "SKU"
		}
	}), [
		s,
		u,
		l,
		d,
		c
	]), Ve = Be[te], He = te === "removal-order-ids" ? "commands" : te, Ue = _.useMemo(() => xe ? jd(xe) : [], [xe]), We = _.useMemo(() => Ap.map((e) => ({
		...e,
		commands: e.commands.filter((e) => Ff(T, e.id))
	})).filter((e) => e.commands.length > 0), [T]), Ge = _.useMemo(() => Ve.extractIds(se), [se, Ve]), Ke = _.useMemo(() => Ve.findIds(se).length - Ge.length, [
		Ge.length,
		se,
		Ve
	]), qe = _.useMemo(() => Qs(k), [k]), Je = _.useMemo(() => Hf(k), [k]), Ye = _.useMemo(() => zf(k), [k]), Xe = qe.length > 0 || Je.length > 0 || Ye.length > 0, Ze = k.trim(), Qe = Ff(T, "accounts"), $e = _.useMemo(() => !Qe || !Ze ? [] : Ce.filter((e) => Ds(e.name, Ze) > 0), [
		Qe,
		Ze,
		Ce
	]), et = _.useMemo(() => !Ff(T, "search-skus") || Xe || $e.length > 0 || Ze.length < 1 || Ze.length > 40 || /\s/u.test(Ze) ? !1 : !We.some((e) => e.commands.some((e) => Ds(e.label, Ze, e.keywords) > 0)), [
		T,
		Xe,
		$e.length,
		Ze,
		We
	]);
	_.useEffect(() => {
		t ? (n === "report-login" || n === "switching" || n === "switch-done") && D(n) : (Re.current += 1, D("commands"), re(""), j(""), M(""), fe([]), F(null), L(!1), ge(null), ve(tc), be($s), Se(null), Pe(null));
	}, [n, t]), _.useEffect(() => {
		if (!t || !Qe) return;
		let e = !1;
		return f().then((t) => {
			e || (we(t.stores), Ee(t.activeSwitch), Oe(t.currentStore ?? null), Ae(!0), Me(t.unlocked));
		}).catch(() => {}), () => {
			e = !0;
		};
	}, [
		Qe,
		f,
		t
	]), _.useEffect(() => {
		if (!t || !Qe || !Te || E === "switching" || E === "switch-done") return;
		let e = !1, n, r = async () => {
			try {
				let t = await f();
				if (e || (Ee(t.activeSwitch), Oe(t.currentStore ?? null), Me(t.unlocked), !t.activeSwitch)) return;
			} catch {}
			e || (n = window.setTimeout(() => void r(), 1e3));
		};
		return n = window.setTimeout(() => void r(), 1e3), () => {
			e = !0, window.clearTimeout(n);
		};
	}, [
		Qe,
		Te?.storeId,
		E,
		f,
		t
	]), _.useEffect(() => {
		Cp(E) && Le.current?.focus();
	}, [E]);
	let tt = _.useCallback(() => {
		let e = Le.current;
		if (!e) return Ie("none");
		Ie(fs(e));
	}, []);
	_.useLayoutEffect(() => {
		Cp(E) && tt();
	}, [
		se,
		E,
		tt
	]);
	let nt = _.useCallback(async (e, t = te) => {
		let n = Be[t];
		F(null), L(!0);
		try {
			await n.submit(e), ze();
		} catch (e) {
			F(e instanceof Error ? e.message : n.failureError), L(!1);
		}
	}, [
		ze,
		te,
		Be
	]), rt = _.useCallback((e, t) => {
		if (!I) {
			if (O(e), t.length === 0) return F(Be[e].invalidError);
			if (t.length > vp) return F(Ep(Be[e].action));
			t.length > _p && Be[e].action !== "scrape" ? (fe(t), F(null), D("confirm-ids")) : nt(t, e);
		}
	}, [
		Be,
		nt,
		I
	]), it = _.useCallback(() => {
		rt(te, Ge);
	}, [
		Ge,
		te,
		rt
	]), at = _.useCallback(async () => {
		F(null), ge("Loading accounts…"), L(!0);
		try {
			let e = await f();
			we(e.stores), Ee(e.activeSwitch), Oe(e.currentStore ?? null), Ae(!0), Me(e.unlocked), j(""), D("accounts");
		} catch (e) {
			F(e instanceof Error ? e.message : "Couldn’t load accounts. Please try again.");
		} finally {
			L(!1);
		}
	}, [f]), R = _.useCallback(async (e) => {
		F(null), L(!0);
		try {
			if (De?.id === e.id) {
				await h(), ze();
				return;
			}
			if (!je) {
				Pe(e), D("unlock"), L(!1);
				return;
			}
			await m(e.id), D("switching"), L(!1);
		} catch (e) {
			F(e instanceof Error ? e.message : "Couldn’t start the account switch."), L(!1);
		}
	}, [
		je,
		ze,
		De,
		h,
		m
	]), ot = _.useCallback(async () => {
		if (Ne && !I) {
			F(null), L(!0);
			try {
				await p(Ne.id), ze();
			} catch (e) {
				F(e instanceof Error ? e.message : "Couldn’t unlock accounts."), L(!1);
			}
		}
	}, [
		ze,
		p,
		Ne,
		I
	]), st = _.useCallback(async () => {
		F(null), L(!0);
		try {
			await y(), ze();
		} catch (e) {
			F(e instanceof Error ? e.message : "Couldn’t open account settings."), L(!1);
		}
	}, [ze, y]), ct = _.useCallback((e) => {
		be((t) => t.includes(e) ? t.filter((t) => t !== e) : $s.filter((n) => n === e || t.includes(n)));
	}, []), lt = _.useCallback(async (e) => {
		if (e.length === 0) return;
		let t = ++Re.current, n = () => t === Re.current;
		F(null), Se(null), ve({
			...tc,
			prepare: "active",
			sections: e
		}), D("generating-reports"), L(!0);
		try {
			let t = await b(e);
			if (!n()) return;
			if (!t.loggedInToStore) {
				if (L(!1), t.openedPromptOnSellerCentral) {
					ze();
					return;
				}
				D("report-login");
				return;
			}
			ve((t) => {
				let n = { ...t.sources };
				for (let t of e) n[t] = { status: "active" };
				return {
					...t,
					prepare: "complete",
					sources: n
				};
			});
			let r = await x(ke ? De?.name ?? "" : void 0, (t) => {
				n() && e.includes(t.source) && ve((e) => ac(e, t));
			}, e);
			if (!n()) return;
			r && Se(r), ve((e) => ({
				...e,
				workbook: "complete"
			})), L(!1);
		} catch (e) {
			if (!n()) return;
			F(e instanceof Error ? e.message : "Couldn’t generate the report. Please try again."), L(!1);
		}
	}, [
		ke,
		ze,
		De,
		x,
		b
	]), ut = _.useCallback(async () => {
		F(null), ge("Opening Time Out…"), L(!0);
		try {
			await C(), ze();
		} catch (e) {
			F(e instanceof Error ? e.message : "Couldn’t open Time Out. Please try again."), L(!1);
		}
	}, [ze, C]), dt = _.useCallback((e) => {
		if (e === "open-case-ids") O("case-ids"), D("case-ids");
		else if (e === "scrape-case") O("scrape-case"), D("scrape-case");
		else if (e === "open-shipment-ids") O("shipment-ids"), D("shipment-ids");
		else if (e === "search-skus") O("sku-ids"), D("sku-ids");
		else if (e === "generate-reports") {
			if (!r) {
				L(!0), a().then(ze, (e) => {
					F(e instanceof Error ? e.message : "Couldn’t open Results."), L(!1);
				});
				return;
			}
			be($s), F(null), D("report-options");
		} else e === "time-out" ? ut() : e === "accounts" && at();
	}, [
		ze,
		a,
		at,
		ut,
		r
	]), ft = _.useCallback(async (e) => {
		F(null), L(!0);
		try {
			e === "focus" ? await g() : (await v(), Ee(void 0));
		} catch (e) {
			F(e instanceof Error ? e.message : "Couldn’t update the account switch.");
		} finally {
			L(!1);
		}
	}, [v, g]), pt = _.useCallback(() => {
		Re.current += 1, o().catch(() => void 0), D(r && E === "generating-reports" ? "report-options" : "commands"), F(null), Se(null), ve(tc);
	}, [
		E,
		o,
		r
	]), mt = _.useCallback((e) => {
		if (e.preventDefault(), E === "switching" || E === "switch-done") return w(!1);
		if (E === "generating-reports") return L(!1), pt();
		if (!I) {
			if (F(null), E === "commands") return k ? re("") : w(!1);
			if (Cp(E)) return se ? M("") : D("commands");
			if (E === "confirm-ids") return D(He);
			if (E === "report-options") return pt();
			if (E === "report-login") return D("commands");
			if (E === "unlock") return D("accounts");
			if (ae) return j("");
			D("commands");
		}
	}, [
		ae,
		k,
		He,
		se,
		E,
		w,
		pt,
		I
	]), ht = {
		commands: {
			title: "Command Palette",
			description: "Search for a command to run."
		},
		accounts: {
			title: "Accounts",
			description: "Search stores or manage account switching."
		},
		unlock: {
			title: "Unlock accounts",
			description: `Unlock to switch to ${Ne?.name ?? "the selected store"}.`
		},
		"confirm-ids": Ve.action === "scrape" ? {
			title: "Confirm scrape",
			description: `Scrape ${P.length} cases.`
		} : {
			title: "Confirm bulk open",
			description: `Open ${P.length} ${Ve.noun} tabs.`
		},
		"report-login": {
			title: "Generate reports",
			description: "Sign in to a Seller Central store to generate reports."
		},
		"report-options": {
			title: "Generate reports",
			description: "Choose what to include in the report."
		},
		"generating-reports": {
			title: "Generate reports",
			description: xe ? "Download the report." : "Generating the Seller Central report."
		},
		switching: {
			title: "Switch store",
			description: "Follow the store switch while it signs in."
		},
		"switch-done": {
			title: "Switch store",
			description: "The store switch finished."
		}
	}, { title: gt, description: z } = Cp(E) ? Ve : ht[E], _t = xp[E], vt = _e.sections.filter((e) => _e.sources[e].status === "complete").length, yt = _e.sections.length, bt = I && he ? /* @__PURE__ */ (0, H.jsxs)("span", {
		"aria-live": "polite",
		className: "inline-flex min-w-0 items-center gap-1.5",
		children: [/* @__PURE__ */ (0, H.jsx)(Ys, {
			"aria-hidden": "true",
			className: "size-3.5",
			role: "presentation"
		}), /* @__PURE__ */ (0, H.jsx)("span", {
			className: "truncate",
			children: he
		})]
	}) : null, xt = (e) => me ? /* @__PURE__ */ (0, H.jsxs)(Wt, {
		className: "mx-1.5 mb-1.5 w-auto",
		id: e,
		variant: "destructive",
		children: [/* @__PURE__ */ (0, H.jsx)(ie, { "aria-hidden": "true" }), /* @__PURE__ */ (0, H.jsx)(Gt, { children: me })]
	}) : null, St = `Current store: ${De?.name ?? "Unknown"}`, Ct = (e, t, n = {}) => /* @__PURE__ */ (0, H.jsx)(ho, {
		autoFocus: n.autoFocus,
		disabled: I || n.disabled,
		keys: n.keys,
		onClick: t,
		type: "button",
		children: e
	}), B = (e) => /* @__PURE__ */ (0, H.jsx)(go, {
		disabled: I,
		onClick: e,
		type: "button"
	}), wt = (e, t, n, r = "status") => /* @__PURE__ */ (0, H.jsxs)("div", {
		className: "flex gap-3 px-4 py-5",
		role: r,
		children: [/* @__PURE__ */ (0, H.jsx)("span", {
			"aria-hidden": "true",
			className: "flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] bg-muted text-foreground/80",
			children: /* @__PURE__ */ (0, H.jsx)(e, { className: "size-4" })
		}), /* @__PURE__ */ (0, H.jsxs)("div", {
			className: "flex flex-col gap-1",
			children: [/* @__PURE__ */ (0, H.jsx)("p", {
				className: "m-0 text-base leading-6 font-medium",
				children: t
			}), /* @__PURE__ */ (0, H.jsx)("p", {
				className: "m-0 text-sm text-muted-foreground",
				children: n
			})]
		})]
	});
	return /* @__PURE__ */ (0, H.jsx)("div", {
		className: "palette-scope",
		children: /* @__PURE__ */ (0, H.jsx)(Bs, {
			container: e,
			contentDepth: _t,
			contentKey: E,
			description: z,
			open: t,
			onEscapeKeyDown: mt,
			onKeyDown: (e) => {
				E !== "report-options" || e.nativeEvent.isComposing || (e.key === "Enter" && (e.metaKey || e.ctrlKey) ? (e.preventDefault(), lt(ye)) : e.key === " " && !(e.target instanceof HTMLButtonElement) && (e.preventDefault(), e.currentTarget.querySelector("[cmdk-item][data-selected=true]")?.click()));
			},
			onOpenChange: w,
			title: gt,
			children: E === "commands" ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
				/* @__PURE__ */ (0, H.jsx)(Vs, {
					autoFocus: !0,
					"aria-label": "Search commands",
					disabled: I,
					onValueChange: (e) => {
						re(e), F(null);
					},
					placeholder: "Type a command, ID or store…",
					value: k
				}),
				/* @__PURE__ */ (0, H.jsxs)(Hs, {
					"aria-label": "Commands",
					children: [
						Xe || et || $e.length > 0 ? null : /* @__PURE__ */ (0, H.jsx)(Us, { children: "No results found." }),
						Xe ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsxs)(Ws, {
							forceMount: !0,
							heading: "Detected",
							children: [
								qe.length > 0 ? /* @__PURE__ */ (0, H.jsxs)(Ks, {
									disabled: I,
									forceMount: !0,
									keywords: qe,
									onSelect: () => rt("case-ids", qe),
									selectedHint: "↵",
									value: Dp("case", qe),
									children: [/* @__PURE__ */ (0, H.jsx)(le, { "aria-hidden": "true" }), /* @__PURE__ */ (0, H.jsx)("span", {
										className: "min-w-0 flex-1 truncate",
										children: Dp("case", qe)
									})]
								}) : null,
								Je.length > 0 ? /* @__PURE__ */ (0, H.jsxs)(Ks, {
									disabled: I,
									forceMount: !0,
									keywords: Je,
									onSelect: () => rt("shipment-ids", Je),
									selectedHint: "↵",
									value: Dp("shipment", Je),
									children: [/* @__PURE__ */ (0, H.jsx)(pe, { "aria-hidden": "true" }), /* @__PURE__ */ (0, H.jsx)("span", {
										className: "min-w-0 flex-1 truncate",
										children: Dp("shipment", Je)
									})]
								}) : null,
								Ye.length > 0 ? /* @__PURE__ */ (0, H.jsxs)(Ks, {
									disabled: I,
									forceMount: !0,
									keywords: Ye,
									onSelect: () => rt("removal-order-ids", Ye),
									selectedHint: "↵",
									value: Dp("removal order", Ye),
									children: [/* @__PURE__ */ (0, H.jsx)(N, { "aria-hidden": "true" }), /* @__PURE__ */ (0, H.jsx)("span", {
										className: "min-w-0 flex-1 truncate",
										children: Dp("removal order", Ye)
									})]
								}) : null
							]
						}), /* @__PURE__ */ (0, H.jsx)(Gs, { alwaysRender: !0 })] }) : null,
						$e.length > 0 ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)(Ws, {
							forceMount: !0,
							heading: "Stores",
							children: $e.map((e) => /* @__PURE__ */ (0, H.jsxs)(Ks, {
								"data-checked": De?.id === e.id || void 0,
								disabled: I,
								end: De?.id === e.id ? /* @__PURE__ */ (0, H.jsx)(Np, {}) : null,
								forceMount: !0,
								keywords: [e.name],
								onSelect: () => void R(e),
								selectedHint: De?.id === e.id ? void 0 : "↵",
								value: `Switch to ${e.name}`,
								children: [/* @__PURE__ */ (0, H.jsx)(ne, { "aria-hidden": "true" }), /* @__PURE__ */ (0, H.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: e.name
								})]
							}, e.id))
						}), /* @__PURE__ */ (0, H.jsx)(Gs, { alwaysRender: !0 })] }) : null,
						et ? /* @__PURE__ */ (0, H.jsx)(H.Fragment, { children: /* @__PURE__ */ (0, H.jsx)(Ws, {
							forceMount: !0,
							heading: "Search",
							children: /* @__PURE__ */ (0, H.jsxs)(Ks, {
								disabled: I,
								forceMount: !0,
								keywords: [Ze],
								onSelect: () => rt("sku-ids", [Ze]),
								selectedHint: "↵",
								value: `Search '${Ze}' as SKU`,
								children: [/* @__PURE__ */ (0, H.jsx)(ue, { "aria-hidden": "true" }), /* @__PURE__ */ (0, H.jsxs)("span", {
									className: "min-w-0 flex-1 truncate",
									children: [
										"Search '",
										Ze,
										"' as SKU"
									]
								})]
							})
						}) }) : null,
						We.map((e, t) => /* @__PURE__ */ (0, H.jsxs)(_.Fragment, { children: [t ? /* @__PURE__ */ (0, H.jsx)(Gs, {}) : null, /* @__PURE__ */ (0, H.jsx)(Ws, {
							heading: e.heading,
							children: e.commands.map((e) => {
								let t = e.icon;
								return /* @__PURE__ */ (0, H.jsxs)(Ks, {
									disabled: I,
									external: e.external,
									keywords: [...e.keywords],
									onSelect: () => dt(e.id),
									selectedHint: e.external ? void 0 : "↵",
									value: e.label,
									children: [/* @__PURE__ */ (0, H.jsx)(t, { "aria-hidden": "true" }), /* @__PURE__ */ (0, H.jsx)("span", {
										className: "min-w-0 flex-1 truncate",
										children: e.label
									})]
								}, e.id);
							})
						})] }, e.heading))
					]
				}),
				xt(),
				/* @__PURE__ */ (0, H.jsx)(mo, {
					end: /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
						/* @__PURE__ */ (0, H.jsx)(po, {
							keys: ["↑", "↓"],
							children: "Navigate"
						}),
						/* @__PURE__ */ (0, H.jsx)(po, {
							keys: ["↵"],
							children: "Select"
						}),
						/* @__PURE__ */ (0, H.jsx)(po, {
							keys: ["esc"],
							children: k ? "Clear" : "Close"
						})
					] }),
					children: bt ?? (Qe && ke && De ? /* @__PURE__ */ (0, H.jsxs)("span", {
						"aria-label": St,
						className: "inline-flex min-w-0 items-center gap-1.5",
						role: "status",
						children: [/* @__PURE__ */ (0, H.jsx)("span", {
							"aria-hidden": "true",
							className: "size-1.5 shrink-0 rounded-full bg-foreground"
						}), /* @__PURE__ */ (0, H.jsx)("span", {
							className: "truncate",
							children: De.name
						})]
					}) : null)
				})
			] }) : E === "accounts" ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
				/* @__PURE__ */ (0, H.jsx)(Js, {
					backDisabled: I,
					divider: !1,
					onBack: pt,
					children: /* @__PURE__ */ (0, H.jsx)(Vs, {
						autoFocus: !0,
						"aria-label": "Search accounts",
						compact: !0,
						disabled: I,
						onValueChange: (e) => {
							j(e), F(null);
						},
						placeholder: "Search stores…",
						value: ae
					})
				}),
				/* @__PURE__ */ (0, H.jsx)("p", {
					"aria-label": St,
					className: "sr-only",
					role: "status",
					children: St
				}),
				Te ? /* @__PURE__ */ (0, H.jsxs)("div", {
					className: "mx-1.5 mt-0.5 mb-1.5 flex items-center gap-2.5 rounded-[0.625rem] bg-muted py-2.5 pr-2.5 pl-3",
					role: "status",
					children: [
						/* @__PURE__ */ (0, H.jsx)(Ys, {
							"aria-hidden": "true",
							className: "text-foreground/70",
							role: "presentation"
						}),
						/* @__PURE__ */ (0, H.jsxs)("div", {
							className: "flex min-w-0 flex-1 flex-col",
							children: [/* @__PURE__ */ (0, H.jsx)("span", {
								className: "truncate font-medium",
								children: Te.stage === "paused" ? "Needs attention" : `Switching to ${Te.storeName}`
							}), /* @__PURE__ */ (0, H.jsx)("span", {
								className: "truncate text-xs leading-4 text-muted-foreground",
								children: Te.attentionMessage ?? np[Te.stage] ?? Te.stage
							})]
						}),
						/* @__PURE__ */ (0, H.jsx)("button", {
							className: "h-7 shrink-0 rounded-[0.375rem] bg-background px-2.5 text-xs leading-4 font-medium text-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted disabled:opacity-50",
							disabled: I,
							onClick: () => void ft("focus"),
							type: "button",
							children: "Show sign-in"
						}),
						/* @__PURE__ */ (0, H.jsx)("button", {
							className: "h-7 shrink-0 rounded-[0.375rem] px-2.5 text-xs leading-4 font-medium text-destructive transition-colors hover:bg-background/60 disabled:opacity-50",
							disabled: I,
							onClick: () => void ft("cancel"),
							type: "button",
							children: "Cancel"
						})
					]
				}) : null,
				/* @__PURE__ */ (0, H.jsxs)(Hs, {
					"aria-label": "Accounts",
					className: "pt-0",
					children: [
						/* @__PURE__ */ (0, H.jsx)(Us, { children: "No matching stores." }),
						/* @__PURE__ */ (0, H.jsxs)(Ws, {
							heading: "Stores",
							children: [Ce.map((e) => {
								let t = De?.id === e.id, n = Te?.storeId === e.id;
								return /* @__PURE__ */ (0, H.jsxs)(Ks, {
									"data-checked": t || void 0,
									disabled: I,
									end: t ? /* @__PURE__ */ (0, H.jsx)(Np, {}) : n ? /* @__PURE__ */ (0, H.jsx)("span", {
										className: "text-xs leading-4 font-normal text-muted-foreground",
										children: "Switching…"
									}) : null,
									onSelect: () => void R(e),
									value: e.name,
									children: [/* @__PURE__ */ (0, H.jsx)(ne, { "aria-hidden": "true" }), /* @__PURE__ */ (0, H.jsx)("span", {
										className: "min-w-0 flex-1 truncate",
										children: e.name
									})]
								}, e.id);
							}), Ce.length === 0 ? /* @__PURE__ */ (0, H.jsx)("div", {
								className: "py-6 text-center text-sm text-muted-foreground",
								children: "No stores configured."
							}) : null]
						}),
						/* @__PURE__ */ (0, H.jsx)(Gs, {}),
						/* @__PURE__ */ (0, H.jsx)(Ws, { children: /* @__PURE__ */ (0, H.jsxs)(Ks, {
							disabled: I,
							external: !0,
							onSelect: () => void st(),
							value: "Manage accounts",
							children: [/* @__PURE__ */ (0, H.jsx)(de, { "aria-hidden": "true" }), /* @__PURE__ */ (0, H.jsx)("span", {
								className: "min-w-0 flex-1 truncate",
								children: "Manage accounts"
							})]
						}) })
					]
				}),
				xt(),
				/* @__PURE__ */ (0, H.jsx)(mo, {
					end: /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)(po, {
						keys: ["↵"],
						children: "Switch"
					}), /* @__PURE__ */ (0, H.jsx)(po, {
						keys: ["esc"],
						children: ae ? "Clear" : "Back"
					})] }),
					children: bt
				})
			] }) : E === "unlock" ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
				/* @__PURE__ */ (0, H.jsx)(Js, {
					backDisabled: I,
					onBack: () => {
						D("accounts"), F(null);
					},
					parent: "Switch store",
					title: "Unlock"
				}),
				/* @__PURE__ */ (0, H.jsxs)("p", {
					className: "m-0 px-4 py-5 text-sm text-muted-foreground",
					children: [
						"Unlock in Accounts to switch to ",
						Ne?.name,
						". Your store switch will continue automatically."
					]
				}),
				xt("unlock-error"),
				/* @__PURE__ */ (0, H.jsx)(mo, {
					action: !0,
					end: Ct(I ? "Opening Accounts…" : "Unlock accounts", () => void ot(), { autoFocus: !0 }),
					children: /* @__PURE__ */ (0, H.jsx)(po, {
						keys: ["esc"],
						children: "Back"
					})
				})
			] }) : E === "confirm-ids" ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
				/* @__PURE__ */ (0, H.jsx)(Js, {
					backDisabled: I,
					onBack: () => {
						D(He), F(null);
					},
					parent: Ve.title,
					title: "Confirm"
				}),
				wt(Ve.action === "scrape" ? oe : te === "shipment-ids" ? pe : te === "sku-ids" ? ue : te === "removal-order-ids" ? N : le, Ve.action === "scrape" ? `Scrape ${P.length} cases?` : `Open ${P.length} ${Ve.noun} tabs in the background?`, Ve.action === "scrape" ? "Each case is downloaded with every reply and date." : "Opening this many tabs can slow the browser for a few seconds."),
				xt(),
				/* @__PURE__ */ (0, H.jsx)(mo, {
					action: !0,
					end: /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [B(() => D(He)), Ct(I ? Tp(Ve.action) : Ve.action === "scrape" ? `Scrape ${P.length} cases` : `Open ${P.length} tabs`, () => void nt(P), { autoFocus: !0 })] })
				})
			] }) : E === "report-options" ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
				/* @__PURE__ */ (0, H.jsx)(Js, {
					aside: ke ? /* @__PURE__ */ (0, H.jsx)("span", {
						"aria-label": St,
						role: "status",
						children: De?.name ?? "No store open"
					}) : null,
					backDisabled: I,
					onBack: pt,
					parent: "Commands",
					title: "Generate reports"
				}),
				/* @__PURE__ */ (0, H.jsx)(Hs, {
					"aria-label": "Report sections",
					"aria-multiselectable": "true",
					children: /* @__PURE__ */ (0, H.jsx)(Ws, {
						heading: "Include",
						children: ec.map((e) => {
							let t = ye.includes(e.id);
							return /* @__PURE__ */ (0, H.jsxs)(Ks, {
								"aria-checked": t,
								className: "gap-2.5",
								"data-checked": t || void 0,
								onSelect: () => ct(e.id),
								selectedHint: "space",
								value: e.label,
								children: [/* @__PURE__ */ (0, H.jsx)(qs, {}), /* @__PURE__ */ (0, H.jsx)("span", {
									className: V("min-w-0 flex-1 truncate", !t && "text-muted-foreground"),
									children: e.label
								})]
							}, e.id);
						})
					})
				}),
				xt(),
				/* @__PURE__ */ (0, H.jsxs)(mo, {
					action: !0,
					end: Ct("Generate report", () => void lt(ye), {
						disabled: ye.length === 0,
						keys: `${bp}↵`
					}),
					children: [/* @__PURE__ */ (0, H.jsxs)("span", {
						className: "tabular-nums",
						children: [
							ye.length,
							" of ",
							$s.length,
							" sections"
						]
					}), /* @__PURE__ */ (0, H.jsx)(po, {
						keys: ["esc"],
						children: "Back"
					})]
				})
			] }) : E === "generating-reports" ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
				/* @__PURE__ */ (0, H.jsx)(Js, {
					aside: /* @__PURE__ */ (0, H.jsxs)("span", {
						className: "tabular-nums",
						children: [
							vt,
							" of ",
							yt
						]
					}),
					backDisabled: I,
					divider: /* @__PURE__ */ (0, H.jsx)("div", {
						"aria-label": "Report progress",
						"aria-valuemax": yt,
						"aria-valuemin": 0,
						"aria-valuenow": vt,
						className: "h-0.5 shrink-0 bg-muted",
						role: "progressbar",
						children: /* @__PURE__ */ (0, H.jsx)("div", {
							className: "h-full bg-primary transition-[width] duration-400 ease-out-expo motion-reduce:transition-none",
							style: { width: `${yt ? 100 * vt / yt : 0}%` }
						})
					}),
					onBack: pt,
					parent: "Generate reports",
					title: xe && !me ? "Report ready" : "Generating"
				}),
				/* @__PURE__ */ (0, H.jsx)(Qf, {
					failed: !!me,
					progress: _e,
					submitting: I,
					warnings: Ue
				}),
				xt(),
				/* @__PURE__ */ (0, H.jsx)(mo, {
					action: !0,
					end: /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [/* @__PURE__ */ (0, H.jsx)(jp, {
						disabled: !xe || !!me,
						label: "Download raw workbook",
						onDownload: () => {
							xe && S(xe, "raw");
						},
						size: "icon",
						title: "Download raw workbook (debug)",
						variant: "ghost",
						children: /* @__PURE__ */ (0, H.jsx)(ce, { "aria-hidden": "true" })
					}), /* @__PURE__ */ (0, H.jsxs)(jp, {
						disabled: !xe || !!me,
						onDownload: () => {
							xe && S(xe, "sheets");
						},
						children: [/* @__PURE__ */ (0, H.jsx)(A, { "aria-hidden": "true" }), "Download"]
					})] }),
					children: /* @__PURE__ */ (0, H.jsx)(po, {
						keys: ["esc"],
						children: I ? "Stop and go back" : "Back"
					})
				})
			] }) : E === "switching" || E === "switch-done" ? /* @__PURE__ */ (0, H.jsx)(hp, {
				doneStoreName: E === "switch-done" ? ee ?? De?.name ?? "the selected store" : void 0,
				onCancel: v,
				onClose: ze,
				onEnded: () => void at(),
				onGetAccountsStatus: f,
				onShowSignIn: g
			}) : E === "report-login" ? /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
				/* @__PURE__ */ (0, H.jsx)(Js, {
					backDisabled: I,
					onBack: pt,
					parent: "Commands",
					title: "Generate reports"
				}),
				wt(ne, "Sign in to a Seller Central store", "Generate reports needs an open Seller Central store. Sign in with Switch store, then try again.", "alert"),
				xt(),
				/* @__PURE__ */ (0, H.jsx)(mo, {
					action: !0,
					end: /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [B(pt), Ct(I ? "Loading…" : "Switch store", () => void at(), { autoFocus: !0 })] })
				})
			] }) : /* @__PURE__ */ (0, H.jsxs)(H.Fragment, { children: [
				/* @__PURE__ */ (0, H.jsx)(Js, {
					backDisabled: I,
					onBack: pt,
					parent: "Commands",
					title: Ve.title
				}),
				/* @__PURE__ */ (0, H.jsxs)("div", {
					className: "flex flex-col gap-2.5 px-3 pt-3 pb-2",
					children: [
						/* @__PURE__ */ (0, H.jsx)("label", {
							className: "text-xs leading-4 font-medium text-muted-foreground",
							htmlFor: "s4e-spotlight-identifier-input",
							children: Ve.label
						}),
						/* @__PURE__ */ (0, H.jsx)("textarea", {
							ref: Le,
							"aria-describedby": me ? "identifier-input-error" : "identifier-input-count",
							"aria-invalid": !!me,
							"aria-label": Ve.ariaLabel,
							className: "identifier-input scroll-fade no-scrollbar h-32 w-full resize-none rounded-[0.625rem] border border-input bg-transparent px-3 py-2.5 font-mono text-[0.8125rem] leading-5 text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
							"data-fade-mask": Fe,
							disabled: I,
							id: "s4e-spotlight-identifier-input",
							placeholder: Ve.placeholder,
							value: se,
							onChange: (e) => {
								M(e.target.value), F(null);
							},
							onScroll: tt,
							onKeyDown: (e) => {
								e.key === "Enter" && (e.shiftKey || e.nativeEvent.isComposing ? e.stopPropagation() : (e.preventDefault(), e.stopPropagation(), it()));
							}
						}),
						Ge.length > 0 ? /* @__PURE__ */ (0, H.jsxs)("ul", {
							"aria-label": `Detected ${Ve.unit}s`,
							className: "m-0 flex list-none flex-wrap gap-1.5 p-0",
							children: [
								Ge.slice(0, Sp).map((e) => /* @__PURE__ */ (0, H.jsx)("li", {
									className: "inline-flex h-[1.375rem] max-w-full animate-in items-center truncate rounded-full bg-muted px-2 font-mono text-xs leading-4 text-foreground/80 fade-in-0 zoom-in-90 duration-150 motion-reduce:animate-none",
									children: e
								}, e)),
								Ge.length > Sp ? /* @__PURE__ */ (0, H.jsxs)("li", {
									className: "inline-flex h-[1.375rem] items-center px-2 text-xs leading-4 text-muted-foreground",
									children: [
										"+",
										Ge.length - Sp,
										" more"
									]
								}) : null,
								Ke > 0 ? /* @__PURE__ */ (0, H.jsxs)("li", {
									className: "inline-flex h-[1.375rem] items-center px-2 text-xs leading-4 text-muted-foreground",
									children: [
										Ke,
										" duplicate",
										Ke === 1 ? "" : "s",
										" ignored"
									]
								}) : null
							]
						}) : null
					]
				}),
				xt("identifier-input-error"),
				/* @__PURE__ */ (0, H.jsxs)("p", {
					"aria-live": "polite",
					className: "sr-only",
					id: "identifier-input-count",
					children: [
						Ge.length,
						" unique ",
						Ve.unit,
						Ge.length === 1 ? "" : "s"
					]
				}),
				/* @__PURE__ */ (0, H.jsxs)(mo, {
					action: !0,
					end: Ct(I ? Tp(Ve.action) : wp(Ve.action, Ge.length, Ve.noun), it, { disabled: Ge.length === 0 }),
					children: [/* @__PURE__ */ (0, H.jsx)(po, {
						keys: ["⇧↵"],
						children: "New line"
					}), /* @__PURE__ */ (0, H.jsx)(po, {
						keys: ["esc"],
						children: "Clear, then back"
					})]
				})
			] })
		})
	});
}
function Np() {
	return /* @__PURE__ */ (0, H.jsx)("span", {
		className: "inline-flex h-5 items-center rounded-full px-2 text-xs leading-4 font-medium text-foreground/70 ring-1 ring-border ring-inset",
		children: "Current"
	});
}
// src/lib/colorScheme.ts
function Pp(e, t = window) {
	let n = t.matchMedia?.("(prefers-color-scheme: dark)");
	if (!n) return () => void 0;
	let r = () => e.classList.toggle("dark", n.matches);
	return r(), n.addEventListener("change", r), () => n.removeEventListener("change", r);
}
// src/lib/viewCase.ts
function Fp(e, t = /* @__PURE__ */ new Date()) {
	if (e.length === 1) return `case-${e[0]}.json`;
	let n = [
		t.getFullYear(),
		t.getMonth() + 1,
		t.getDate()
	].map((e) => String(e).padStart(2, "0")).join("-");
	return `cases-${e.length}-${n}.json`;
}
function Ip(e) {
	let t = e.errors ?? [];
	if (!(e.cases.length > 0 && t.length === 0)) return t.length === 1 ? `Couldn’t scrape ${t[0].caseId}. ${t[0].error}` : t.length > 1 ? `Couldn’t scrape ${t.map((e) => e.caseId).join(", ")}.` : "Couldn’t scrape cases. Please try again.";
}
function Lp(e, t, n = document, r = /* @__PURE__ */ new Date()) {
	let i = URL.createObjectURL(new Blob([JSON.stringify(e, null, 2)], { type: "application/json" })), a = n.createElement("a");
	a.href = i, a.download = Fp(t, r), n.body.append(a), a.click(), a.remove(), setTimeout(() => URL.revokeObjectURL(i), 1e3);
}
// src/lib/shortcut.ts
function Rp(e) {
	let t = e.code === "Slash" || e.key === "/", n = e.metaKey || e.ctrlKey;
	return t && n && !e.altKey && !e.shiftKey;
}
// src/paletteApp.tsx
var zp = "command-palette-extension-root", Bp = "data-s4e-palette-open", Vp = "__s4eSpotlightPasteGuard", Hp = "geist-latin-wght-normal.woff2", Up = "geist-mono-latin-wght-normal.woff2", Wp = 120, Gp = Lc("palette");
typeof chrome < "u" && chrome.runtime?.id && Ac(Rc());
async function Kp(e, t, n) {
	let r = typeof chrome < "u" && typeof chrome.runtime?.getURL == "function" ? chrome.runtime.getURL(n) : "";
	if (r && typeof FontFace < "u" && e.fonts) try {
		let n = new FontFace(t, `url("${r}")`, {
			display: "swap",
			style: "normal",
			weight: "100 900"
		});
		e.fonts.add(n), await n.load();
	} catch {}
}
async function qp(e) {
	Kp(e, "Geist Mono Variable", Up), await Kp(e, "Geist Variable", Hp);
}
function Jp(e, t, n) {
	return new Promise((r) => {
		let i = !1, a = () => {
			i || (i = !0, r());
		};
		e.then(a, a), n ? n.setTimeout(a, t) : a();
	});
}
function Yp(e, t) {
	let n = Object.keys(t).map((t) => [
		t,
		e.style.getPropertyValue(t),
		e.style.getPropertyPriority(t)
	]);
	for (let [n, [r, i = ""]] of Object.entries(t)) e.style.setProperty(n, r, i);
	return () => {
		for (let [t, r, i] of n) r ? e.style.setProperty(t, r, i) : e.style.removeProperty(t);
	};
}
var Xp = "data-scroll-locked", Zp = [
	"overflow-x",
	"overflow-y",
	"position",
	"margin-top",
	"margin-right",
	"margin-left",
	"padding-top",
	"padding-right",
	"padding-left"
];
function Qp(e) {
	let { body: t } = e, n = e.defaultView;
	if (!n) return () => {};
	let r = n.getComputedStyle(t), i = Yp(t, Object.fromEntries(Zp.map((e) => [e, [r.getPropertyValue(e), "important"]]))), a = e.scrollingElement ?? e.documentElement, { scrollLeft: o, scrollTop: s } = a, c = (t) => {
		(t.target === e ? a : t.target) === a && (a.scrollTop !== s || a.scrollLeft !== o) && a.scrollTo({
			left: o,
			top: s,
			behavior: "instant"
		});
	};
	return e.addEventListener("scroll", c, {
		capture: !0,
		passive: !0
	}), () => {
		e.removeEventListener("scroll", c, { capture: !0 }), i();
	};
}
function $p(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot?.activeElement;) t = t.shadowRoot.activeElement;
	return t instanceof HTMLElement ? t : null;
}
function em(e) {
	let t = parseFloat(e.defaultView?.getComputedStyle(e.documentElement).fontSize ?? "16");
	return !Number.isFinite(t) || t <= 0 ? 1 : 16 / t;
}
function tm(e, t) {
	let n = em(t);
	return e.style.zoom = String(n), n;
}
async function nm(e) {
	let t = await chrome.runtime.sendMessage(e);
	if (!t?.ok) throw Error(t?.error ?? "The background worker did not respond.");
	return t;
}
async function rm(e) {
	await nm({
		type: "OPEN_CASE_IDS",
		caseIds: e
	});
}
async function im(e, t = document) {
	await nm({
		type: "RESULTS_OPEN",
		mode: "cases",
		caseIds: e
	});
}
async function am(e, t, n = document) {
	let r = (await nm({
		type: "SCRAPE_CASES",
		caseIds: e,
		runId: t
	})).file;
	if (!r || !Array.isArray(r.cases)) throw Error("Couldn’t scrape cases. Please try again.");
	let i = Ip(r);
	if (r.cases.length === 0) throw Error(i ?? "Couldn’t scrape cases. Please try again.");
	if (Lp(r, e, n), i) throw Error(i);
}
async function om(e) {
	await nm({
		type: "OPEN_SHIPMENT_IDS",
		shipmentIds: e
	});
}
async function sm(e) {
	await nm({
		type: "OPEN_REMOVAL_ORDER_IDS",
		removalOrderIds: e
	});
}
async function cm(e) {
	await nm({
		type: "OPEN_SKU_IDS",
		skuIds: e
	});
}
async function lm() {
	await nm({ type: "OPEN_TIME_OUT" });
}
async function um() {
	let e = await nm({ type: "ACCOUNTS_STATUS" });
	return {
		initialized: e.initialized,
		unlocked: e.unlocked,
		stores: e.stores,
		activeSwitch: e.activeSwitch,
		currentStore: e.currentStore ?? null
	};
}
async function dm(e) {
	await nm({
		type: "ACCOUNTS_REQUEST_UNLOCK",
		storeId: e
	});
}
async function fm() {
	await nm({
		type: "RESULTS_OPEN",
		mode: "reports"
	});
}
async function pm(e) {
	await nm({
		type: "ACCOUNTS_START_SWITCH",
		storeId: e
	});
}
async function mm() {
	await nm({ type: "ACCOUNTS_FOCUS_CURRENT_STORE" });
}
async function hm() {
	await nm({ type: "ACCOUNTS_FOCUS_SWITCH" });
}
async function gm() {
	await nm({ type: "ACCOUNTS_CANCEL_SWITCH" });
}
async function _m() {
	await nm({ type: "ACCOUNTS_SWITCH_NOTICE_DISMISS" });
}
async function vm() {
	await nm({ type: "ACCOUNTS_OPEN_OPTIONS" });
}
async function ym() {
	if (typeof chrome > "u" || !chrome.runtime?.sendMessage) return Pf(void 0);
	try {
		let e = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
		if (!e?.ok) throw Error(e?.error ?? "The background worker did not respond.");
		return Pf(e.settings);
	} catch (e) {
		return Gp.warn("settings.loadFailed", { error: Fc(e) }), Pf(void 0);
	}
}
async function bm(e = $s) {
	let t = await nm({
		type: "REPORTS_PREPARE",
		sections: e
	});
	return {
		loggedInToStore: t.loggedInToStore !== !1,
		runId: t.runId,
		openedPromptOnSellerCentral: t.openedPromptOnSellerCentral
	};
}
async function xm(e, t, n) {
	let r = (await nm({
		type: e,
		...n ? { runId: n } : {}
	}))[t];
	return Array.isArray(r) ? r : [];
}
async function Sm(e) {
	let t = await nm({
		type: "REPORTS_FETCH_UNFULFILLABLE",
		...e ? { runId: e } : {}
	}), n = t.nextRemovalOrderId;
	return {
		listings: Array.isArray(t.listings) ? t.listings : [],
		nextRemovalOrderId: typeof n == "string" && n ? n : null
	};
}
var Cm = /* @__PURE__ */ new Set();
function wm(e) {
	return Cm.add(e), () => {
		Cm.delete(e);
	};
}
function Tm(e) {
	for (let t of Cm) t(e);
}
async function Em(e = /* @__PURE__ */ new Date(), t, n, r = $s, i) {
	let a = n ? wm(n) : () => void 0, o = Gp.time("report.run"), s = {}, c = (e, t, i, a) => {
		if (!r.includes(e)) return Promise.resolve(i);
		let o = jc(), c = () => Math.round(jc() - o);
		return t().then((t) => {
			let r = a(t);
			return s[e] = {
				ms: c(),
				count: r
			}, n?.({
				source: e,
				status: "complete",
				loaded: r,
				total: r
			}), t;
		}, (t) => {
			let r = Pc(t, "Couldn’t load this report section.");
			return s[e] = {
				ms: c(),
				error: r
			}, Gp.warn("report.sourceFailed", {
				source: e,
				error: Fc(t)
			}), n?.({
				source: e,
				status: "error",
				error: r
			}), i;
		});
	};
	try {
		let a = t === void 0 ? (await um()).currentStore?.name ?? "" : t;
		for (let e of r) n?.({
			source: e,
			status: "active"
		});
		let l = (e) => e.length, [u, d, f, p, m] = await Promise.all([
			c("unfulfillable", () => Sm(i), {
				listings: [],
				nextRemovalOrderId: null
			}, (e) => e.listings.length),
			c("feedback", () => xm("REPORTS_FETCH_FEEDBACK", "feedbacks", i), [], l),
			c("stranded", () => xm("REPORTS_FETCH_STRANDED", "listings", i), [], l),
			c("suppressed", () => xm("REPORTS_FETCH_SUPPRESSED", "listings", i), [], l),
			c("shippingQueue", () => xm("REPORTS_FETCH_SHIPPING_QUEUE", "shipments", i), [], l)
		]), h = Object.entries(s), g = h.reduce((e, t) => !e || Number(t[1].ms) > Number(e[1].ms) ? t : e, void 0), _ = {
			storeName: a,
			generatedAt: e,
			sections: r,
			unfulfillableListings: u.listings,
			nextRemovalOrderId: u.nextRemovalOrderId,
			feedbacks: d,
			strandedListings: f,
			suppressedListings: p,
			shipments: m
		}, v = jd(_);
		return o({
			sections: [...r],
			sources: s,
			slowest: g?.[0],
			failed: h.filter(([, e]) => e.error).map(([e]) => e),
			...v.length ? { warnings: v.map(({ source: e, text: t }) => `${e}: ${t}`) } : {}
		}), _;
	} catch (e) {
		throw o({
			error: Fc(e),
			sources: s
		}, "error"), e;
	} finally {
		a();
	}
}
function Dm({ document: e = window.document, shadowMode: t = "closed" } = {}) {
	if (e.getElementById(zp)) return null;
	let n = e.createElement("div");
	n.id = zp, n.setAttribute(Bp, "false"), n.style.cssText = "all: initial;position: fixed;inset: 0;z-index: 2147483647;pointer-events: none", tm(n, e);
	let r = Pp(n, e.defaultView ?? window), i = n.attachShadow({ mode: t }), a = e.createElement("style");
	a.textContent = b, i.append(a);
	let o = e.createElement("div");
	o.className = "palette-scope", o.style.pointerEvents = "auto", i.append(o), (e.body ?? e.documentElement).append(n);
	let s = (0, y.createRoot)(o), c = !1, l = "commands", u = null, d = null, f = null, p = () => {
		f?.(), d?.(), d = null;
	}, m = () => {
		let t = e.body;
		if (!d || !t?.hasAttribute(Xp)) {
			p();
			return;
		}
		let n = e.defaultView ?? window, r = new MutationObserver(() => {
			t.hasAttribute(Xp) || p();
		}), i = n.setTimeout(p, 1e3);
		r.observe(t, {
			attributes: !0,
			attributeFilter: [Xp]
		}), f = () => {
			r.disconnect(), n.clearTimeout(i), f = null;
		};
	}, h = jf, g = 0, x = !1, S = null, C = 0, w, T = !1, ee = !1, E = qp(e).finally(() => {
		T = !0;
	}), D = ym().then((e) => {
		ee = !0, !If(h, e.features) && (h = e.features, c && te());
	}), te = () => {
		s?.render(/* @__PURE__ */ (0, H.jsxs)(_.StrictMode, { children: [/* @__PURE__ */ (0, H.jsx)(Mp, {
			container: i,
			enabledFeatures: h,
			initialMode: l,
			open: c,
			onOpenCaseIds: rm,
			onOpenReports: fm,
			onScrapeCases: (t) => im(t, e),
			onOpenShipmentIds: om,
			onOpenRemovalOrderIds: sm,
			onOpenSkuIds: cm,
			onGetAccountsStatus: um,
			onUnlockAccounts: dm,
			onStartAccountSwitch: pm,
			onFocusCurrentStore: mm,
			onFocusAccountSwitch: hm,
			onCancelAccountSwitch: gm,
			onManageAccounts: vm,
			onOpenTimeOut: lm,
			onOpenChange: ie,
			switchedStoreName: w
		}), S ? (0, v.createPortal)(/* @__PURE__ */ (0, H.jsx)(gp, {
			doneStoreName: S.doneStoreName,
			onCancel: gm,
			onDismiss: ne,
			onGetAccountsStatus: um,
			onShowSignIn: hm
		}, S.key), i) : null] }));
	}, O = (e) => {
		S = {
			key: ++C,
			...e ? { doneStoreName: e } : {}
		}, te();
	};
	function ne() {
		S && (S = null, te(), _m().catch(() => void 0));
	}
	let k = () => {
		c || S || !Ff(h, "accounts") || um().then((e) => {
			e.activeSwitch && !S && !c && O();
		}, () => void 0);
	}, re = () => {
		e.visibilityState === "visible" && k();
	};
	e.addEventListener("visibilitychange", re);
	let ie = (t, r = "commands") => {
		if (l = t ? r : "commands", t === c) {
			t && te();
			return;
		}
		let i = ++g;
		t ? (S = null, u = $p(e), tm(n, e), f ? f() : d = Qp(e)) : (m(), w !== void 0 && (w = void 0, _m().catch(() => void 0))), c = t, n.setAttribute(Bp, String(t)), n.style.pointerEvents = t ? "auto" : "none";
		let a = () => {
			i === g && (te(), t && ym().then((e) => {
				c && (If(h, e.features) || (h = e.features, te()));
			}), t || (requestAnimationFrame(() => u?.focus({ preventScroll: !0 })), k()));
		};
		if (t && !x) {
			let t = jc();
			Jp(Promise.all([E, D]), Wp, e.defaultView).then(() => {
				if (x = !0, !T || !ee) {
					let e = Math.round(jc() - t);
					Gp.warn("palette.slowFirstOpen", {
						waitedMs: e,
						fontLoaded: T,
						settingsLoaded: ee
					});
				}
				a();
			});
		} else a();
	}, ae = (e) => {
		Rp(e) && (e.preventDefault(), e.stopImmediatePropagation(), ie(!c));
	};
	e.defaultView?.addEventListener("keydown", ae, !0);
	let A = (e) => {
		ic(e) && Tm(e);
	};
	return typeof chrome < "u" && chrome.runtime?.onMessage?.addListener(A), {
		host: n,
		shadowRoot: i,
		setOpen: ie,
		showSwitchDone: (e) => {
			w = e, ie(!0, "switch-done");
		},
		destroy: () => {
			n.setAttribute(Bp, "false"), p(), e.defaultView?.removeEventListener("keydown", ae, !0), e.removeEventListener("visibilitychange", re), typeof chrome < "u" && chrome.runtime?.onMessage?.removeListener(A), e.defaultView?.[Vp]?.destroy(), r(), s?.unmount(), s = null, n.remove();
		}
	};
}
export { gm as cancelAccountSwitch, _m as dismissSwitchNotice, Tm as dispatchReportProgress, hm as focusAccountSwitch, mm as focusCurrentStore, Em as generateReports, um as getAccountsStatus, em as getPaletteRemScale, ym as getSettings, qp as loadPaletteFont, vm as manageAccounts, Dm as mountCommandPalette, rm as openCaseIds, sm as openRemovalOrderIds, fm as openReports, om as openShipmentIds, cm as openSkuIds, lm as openTimeOut, bm as prepareReports, im as scrapeCaseIds, am as scrapeProtectedCaseIds, pm as startAccountSwitch, wm as subscribeReportProgress, dm as unlockAccounts };
