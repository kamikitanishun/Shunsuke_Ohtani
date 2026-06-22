fetch('links.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('links-container');
    container.innerHTML = '';

    data.forEach(link => {
      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';

      const a = document.createElement('a');
      a.className = 'link-content';
      a.href = link.url;
      a.target = '_blank';

      const icon = document.createElement('img');
      icon.src = link.icon;
      icon.alt = link.title;
      icon.className = 'icon';

      const title = document.createElement('span');
      title.textContent = link.title;

      a.appendChild(icon);
      a.appendChild(title);
      linkItem.appendChild(a);
      container.appendChild(linkItem);
    });
  })
  .catch(error => {
    document.getElementById('links-container').textContent = 'リンクの読み込みに失敗しました。';
    console.error('リンク読み込みエラー:', error);
  });
