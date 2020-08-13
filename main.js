/* jshint curly:true, debug:true */
/* globals $, firebase */

/**
 * -------------------
 * 書籍一覧画面関連の関数
 * -------------------
 */

// 書籍の表紙画像をダウンロードする
const downloadBookImage = (bookImageLocation) =>
  firebase
    .storage()
    .ref(bookImageLocation)
    .getDownloadURL() // book-images/abcdef のようなパスから画像のダウンロードURLを取得
    .catch((error) => {
      console.error("写真のダウンロードに失敗:", error);
    });

// 書籍の表紙画像を表示する
const displayBookImage = ($divTag, url) => {
  $divTag.find(".book-item__image").attr({
    src: url,
  });
};

// 書籍の表示用のdiv（jQueryオブジェクト）を作って返す
const createBookDiv = (bookId, bookData) => {
  // HTML内のテンプレートからコピーを作成する
  const $divTag = $("#book-template > .book-item").clone();

  // 書籍タイトルを表示する
  $divTag.find(".book-item__title").text(bookData.bookTitle);

  // 書籍の表紙画像をダウンロードして表示する
  downloadBookImage(bookData.bookImageLocation).then((url) => {
    displayBookImage($divTag, url);
  });

  // id属性をセット
  $divTag.attr("id", `book-id-${bookId}`);

  return $divTag;
};

// 書籍一覧画面内の書籍データをクリア
const resetBookshelfView = () => {
  $("#book-list").empty();
};

// 書籍一覧画面に書籍データを表示する
const addBook = (bookId, bookData) => {
  const $divTag = createBookDiv(bookId, bookData);
  $divTag.appendTo("#book-list");
};

// 書籍一覧画面の初期化、イベントハンドラ登録処理
const loadBookshelfView = () => {
  resetBookshelfView();

  // 書籍データを取得
  const booksRef = firebase.database().ref("books").orderByChild("createdAt");

  // 過去に登録したイベントハンドラを削除
  booksRef.off("child_added");

  // books の child_addedイベントハンドラを登録
  // （データベースに書籍が追加保存されたときの処理）
  booksRef.on("child_added", (bookSnapshot) => {
    const bookId = bookSnapshot.key;
    const bookData = bookSnapshot.val();

    // 書籍一覧画面に書籍データを表示する
    addBook(bookId, bookData);
  });
};

/**
 * ----------------------
 * すべての画面共通で使う関数
 * ----------------------
 */

// ビュー（画面）を変更する
const showView = (id) => {
  $(".view").hide();
  $(`#${id}`).fadeIn();

  if (id === "bookshelf") {
    loadBookshelfView();
  }
};

/**
 * -------------------------
 * ログイン・ログアウト関連の関数
 * -------------------------
 */

// ログインフォームを初期状態に戻す
const resetLoginForm = () => {
  $("#login__help").hide();
  $("#login__submit-button").text("ログイン");
};

// ログインした直後に呼ばれる
const onLogin = () => {
  console.log("ログイン完了");

  // 書籍一覧画面を表示
  showView("bookshelf");
};

// ログアウトした直後に呼ばれる
const onLogout = () => {
  const booksRef = firebase.database().ref("books");

  // 過去に登録したイベントハンドラを削除
  booksRef.off("child_added");

  showView("login");
};

/**
 * ------------------
 * イベントハンドラの登録
 * ------------------
 */

// ログイン状態の変化を監視する
firebase.auth().onAuthStateChanged((user) => {
  // ログイン状態が変化した
  if (user) {
    // ログイン済
    onLogin();
  } else {
    // 未ログイン
    onLogout();
  }
});

// ログインフォームが送信されたらログインする
$("#login-form").on("submit", (e) => {
  e.preventDefault();

  const $loginButton = $("#login__submit-button");
  $loginButton.text("送信中…");

  const email = $("#login-email").val();
  const password = $("#login-password").val();

  // TODO: ログインを試みる
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(() => {
      console.log("ログインしました");
      resetLoginForm();
    })
    .catch((error) => {
      console.error("ログインエラー", error);

      $("#login__help").text("ログインに失敗しました。").show();

      $loginButton.text("ログイン");
    });
});

// ログアウトボタンが押されたらログアウトする
$(".logout-button").on("click", () => {
  firebase
    .auth()
    .signOut()
    .catch((error) => {
      console.error("ログアウトに失敗:", error);
    });
});

/**
 * -------------------------
 * 書籍情報追加モーダル関連の処理
 * -------------------------
 */

// 書籍の登録モーダルを初期状態に戻す
const resetAddBookModal = () => {
  $("#book-form")[0].reset();
  $("#add-book-image-label").text("");
  $("#submit_add_book").text("保存する");
};

// 選択した表紙画像の、ファイル名を表示する
$("#add-book-image").on("change", (e) => {
  const input = e.target;
  const file = input.files[0];
  const $label = $("#add-book-image-label");

  if (file != null) {
    $label.text(file.name);
  } else {
    $label.text("ファイルを選択");
  }
});

// 書籍の登録処理
$("#book-form").on("submit", (e) => {
  e.preventDefault();

  // 書籍の登録ボタンを押せないようにする
  $("#submit_add_book").prop("disabled", true).text("送信中…");

  // 書籍タイトル
  const bookTitle = $("#add-book-title").val();

  const $bookImage = $("#add-book-image");
  const { files } = $bookImage[0];

  if (files.length === 0) {
    // ファイルが選択されていないなら何もしない
    return;
  }

  const file = files[0]; // 表紙画像ファイル
  const filename = file.name; // 画像ファイル名
  const bookImageLocation = `book-images/${filename}`; // 画像ファイルのアップロード先

  // TODO: 書籍データを保存する
});
