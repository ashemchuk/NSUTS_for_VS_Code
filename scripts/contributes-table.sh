#!/bin/bash

# Проверяем, что мы находимся в репозитории git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Ошибка: не найден .git каталог. Убедитесь, что вы находитесь в репозитории git."
    exit 1
fi

# Заголовок CSV
echo "author,hash,message,date"

# Получаем историю коммитов и форматируем их в CSV
git log --pretty=format:"%an|%H|%s|%ad" --date=short | while IFS='|' read -r author hash subject date; do
    # Экранируем запятые в тексте коммита
    escaped_subject=$(echo "$subject" | sed 's/,/;/g')
    # Выводим строку в формате CSV
    echo "\"$author\",\"${hash:0:6}\",\"$escaped_subject\",\"$date\""
done